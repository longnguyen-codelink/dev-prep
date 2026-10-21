import type { RangeResponse, Source } from "pmtiles";

// Chrome's HTTP cache runs concurrent range requests to one URL one after another, so the cache is bypassed
// (the library does the same on Chrome for Windows).
export function fetchRange(url: string | URL, offset: number, length: number, signal?: AbortSignal): Promise<Response> {
  return fetch(url, { signal, cache: "no-store", headers: { range: `bytes=${offset}-${offset + length - 1}` } });
}

// The app's own PM Tiles source, so every range read goes through fetchRange.
export function createPmtilesSource(url: string): Source {
  return {
    getKey: () => url, // the protocol looks the archive up by this key, so it must equal the pmtiles:// source URL
    getBytes: async (offset, length, signal) => {
      const response = await fetchRange(url, offset, length, signal);

      // A 200 means the server ignored Range and sent the whole file: fail instead of reading it.
      if (response.status !== 206) {
        await response.arrayBuffer();
        throw new Error(`HTTP ${response.status} for a range request (expected 206): ${new URL(url).pathname}`);
      }

      const etag = response.headers.get("ETag");
      const result: RangeResponse = {
        data: await response.arrayBuffer(),
        etag: etag === null || etag.startsWith("W/") ? undefined : etag,
        cacheControl: response.headers.get("Cache-Control") ?? undefined,
        expires: response.headers.get("Expires") ?? undefined,
      };
      return result;
    },
  };
}
