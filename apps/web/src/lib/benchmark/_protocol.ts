import { addProtocol, AJAXError, removeProtocol, type AddProtocolAction } from "maplibre-gl";
import type { Source } from "pmtiles";

import { BENCHMARK_PROTOCOL, BENCHMARK_RUN_PARAM } from "@/constants";
import { fetchRange, tryCatch } from "@/lib/utils";

const PROTOCOLS = [`${BENCHMARK_PROTOCOL}-http`, `${BENCHMARK_PROTOCOL}-https`];
const PREFIX = `${BENCHMARK_PROTOCOL}-`;

export type DataProtocol = {
  toProtocolUrl: (url: string) => string;
  toPmtilesSource: (url: string) => Source; // a PM Tiles source whose range requests carry the run tag
  missing: Set<string>; // absolute URLs (with the run tag) the server did not have
  dispose: () => void;
};

// The scheme becomes the protocol name, so any origin works: "https://h/x" -> "bench-https://h/x", "/map/x" -> "bench-http://localhost:5173/map/x".
// The URL is not parsed because a tile template's {z}/{x}/{y} must stay as written.
const toProtocolUrl = (url: string) =>
  /^https?:\/\//.test(url) ? PREFIX + url : `${PREFIX}${window.location.protocol.slice(0, -1)}://${window.location.host}${url.replace(/^\.\//, "/")}`;

/**
 * Serves the overlay data through the main thread, tagging every request with the run id so Resource Timing can pick it out.
 * A missing tile is normal (empty area), a missing GeoJSON or any other error is a failure.
 */
export function registerDataProtocol(runId: string, onFailure: (reason: string) => void): DataProtocol {
  const missing = new Set<string>();

  const handler: AddProtocolAction = async (params, abortController) => {
    const url = new URL(params.url.slice(PREFIX.length));
    url.searchParams.set(BENCHMARK_RUN_PARAM, runId);

    const { data: response, error } = await tryCatch(fetch(url, { signal: abortController.signal }));
    if (!response) {
      if (!abortController.signal.aborted) onFailure(`request failed: ${url.pathname} (${String(error)})`);
      throw error;
    }

    // The Vite dev server answers a missing file with index.html and status 200.
    const isMissing = response.status === 404 || (response.ok && response.headers.get("content-type")?.includes("text/html"));
    if (isMissing) {
      missing.add(url.href);
      await readBody(response, "arrayBuffer"); // Resource Timing only records the request once its body is read
      if (params.type !== "arrayBuffer") onFailure(`file missing: ${url.pathname}`);
      throw new AJAXError(404, "Not Found", url.href, new Blob());
    }

    if (!response.ok) {
      await readBody(response, "arrayBuffer");
      onFailure(`HTTP ${response.status}: ${url.pathname}`);
      throw new AJAXError(response.status, response.statusText, url.href, new Blob());
    }

    return { data: await readBody(response, params.type === "json" ? "json" : "arrayBuffer", abortController.signal) };
  };

  for (const name of PROTOCOLS) addProtocol(name, handler);

  // A truncated or malformed body fails the run at once instead of waiting for the timeout.
  async function readBody(response: Response, kind: "json" | "arrayBuffer", signal?: AbortSignal) {
    const { data, error } = await tryCatch<ArrayBuffer, Error>(kind === "json" ? response.json() : response.arrayBuffer());

    if (data) return data;

    if (!signal?.aborted) onFailure(`could not read ${new URL(response.url).pathname} (${String(error?.message)})`);
    throw error;
  }

  // The library's default fetch would send untagged requests, so PM Tiles range requests are made here instead.
  // Range reads still go through fetchRange, the same code the app uses, so they cannot drift apart.
  const toPmtilesSource = (url: string): Source => ({
    getKey: () => url, // untagged: the protocol looks the archive up by the source URL
    getBytes: async (offset, length, signal) => {
      const tagged = new URL(url);
      tagged.searchParams.set(BENCHMARK_RUN_PARAM, runId);

      const { data: response, error } = await tryCatch<Response, Error>(fetchRange(tagged, offset, length, signal));
      if (error) {
        if (!signal?.aborted) onFailure(`request failed: ${tagged.pathname} (${String(error)})`);
        throw error;
      }

      // A 200 means the server ignored Range and sent the whole file: fail the run, never count it.
      if (response.status !== 206) {
        await readBody(response, "arrayBuffer", signal);
        const reason = `HTTP ${response.status} for a range request (expected 206): ${tagged.pathname}`;
        if (!signal?.aborted) onFailure(reason);
        throw new Error(reason);
      }

      const data = await readBody(response, "arrayBuffer", signal);
      const etag = response.headers.get("ETag");
      return {
        data,
        etag: etag === null || etag.startsWith("W/") ? undefined : etag,
        cacheControl: response.headers.get("Cache-Control") ?? undefined,
        expires: response.headers.get("Expires") ?? undefined,
      };
    },
  });

  return { toProtocolUrl, toPmtilesSource, missing, dispose: () => PROTOCOLS.forEach(removeProtocol) };
}
