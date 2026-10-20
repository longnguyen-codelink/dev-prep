import { addProtocol, AJAXError } from "maplibre-gl";

import { BENCHMARK_PROTOCOL, BENCHMARK_RUN_PARAM } from "@/constants";

const PREFIX = `${BENCHMARK_PROTOCOL}://`;

export type DataProtocol = {
  toProtocolUrl: (url: string) => string;
  missing: Set<string>; // absolute URLs (with the run tag) the server did not have
};

// "./map/x" and "/map/x" both become "bench://map/x".
const toProtocolUrl = (url: string) => url.replace(/^\.?\//, PREFIX);

/**
 * Serves the overlay data through the main thread, tagging every request with the run id so Resource Timing can pick it out.
 * A missing tile is normal (empty area), a missing GeoJSON or any other error is a failure.
 */
export function registerDataProtocol(
  runId: string,
  onFailure: (reason: string) => void,
): DataProtocol {
  const missing = new Set<string>();

  addProtocol(BENCHMARK_PROTOCOL, async (params, abortController) => {
    const url = new URL(`/${params.url.slice(PREFIX.length)}`, window.location.origin);
    url.searchParams.set(BENCHMARK_RUN_PARAM, runId);

    let response: Response;
    try {
      response = await fetch(url, { signal: abortController.signal });
    } catch (error) {
      if (!abortController.signal.aborted)
        onFailure(`request failed: ${url.pathname} (${String(error)})`);
      throw error;
    }

    // The Vite dev server answers a missing file with index.html and status 200.
    const isMissing =
      response.status === 404 ||
      (response.ok && response.headers.get("content-type")?.includes("text/html"));
    if (isMissing) {
      missing.add(url.href);
      await response.arrayBuffer(); // Resource Timing only records the request once its body is read
      if (params.type !== "arrayBuffer") onFailure(`file missing: ${url.pathname}`);
      throw new AJAXError(404, "Not Found", url.href, new Blob());
    }
    if (!response.ok) {
      await response.arrayBuffer();
      onFailure(`HTTP ${response.status}: ${url.pathname}`);
      throw new AJAXError(response.status, response.statusText, url.href, new Blob());
    }

    return { data: params.type === "json" ? await response.json() : await response.arrayBuffer() };
  });

  return { toProtocolUrl, missing };
}
