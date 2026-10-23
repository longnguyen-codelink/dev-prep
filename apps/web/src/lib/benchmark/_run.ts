import type { ErrorEvent, Map } from "maplibre-gl";

import {
  BENCHMARK_BOUNDARY_PARAM,
  BENCHMARK_RESOURCE_BUFFER,
  BENCHMARK_RUN_PARAM,
  BENCHMARK_SAVE_ENDPOINT,
  BENCHMARK_TIMEOUT_MS,
  type Mode,
  type TileMode,
} from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { ROADS_SOURCE_ID, WARDS_SOURCE_ID } from "@/lib/map-layers";
import { tryCatch } from "@/lib/utils";

import { registerDataProtocol } from "./_protocol";
import { saveRun, variantOf } from "./_storage";
import type { BenchmarkRun } from "./_types";

// Development only: the dev server appends the run to tmp/benchmark/runs.json. keepalive lets the request survive a
// reload right after the run; a failure (no dev server, blocked) is ignored because the run is also in localStorage.
function saveRunToDisk(run: BenchmarkRun): void {
  if (!import.meta.env.DEV) return;
  fetch(BENCHMARK_SAVE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(run),
    keepalive: true,
  }).catch(() => {});
}

// The boundary is a plain GeoJSON source fetched by the map, outside the benchmark protocol, so its size is measured here with one
// extra tagged request (a worker's requests do not show up in the page's Resource Timing). Null when it cannot be measured.
async function measureBoundaryBytes(): Promise<number | null> {
  const url = new URL(MAP_URLS.boundaryGeoJson, window.location.href);
  url.searchParams.set(BENCHMARK_BOUNDARY_PARAM, Date.now().toString(36));
  const { data: response } = await tryCatch(fetch(url));
  if (!response?.ok) return null;
  await response.arrayBuffer();
  const entry = performance.getEntriesByName(url.href, "resource")[0] as PerformanceResourceTiming | undefined;
  return entry?.encodedBodySize || null;
}

/**
 * Call once per page load, right after the map is created. Pass `toProtocolUrl` to addRoadsLayer and addWardsLayer. The run
 * ends, and is stored, when the data sources (roads, and the wards in GeoJSON mode) are loaded and the map is idle, or on a failure, or after the timeout; call `fail` if
 * adding the layers throws and `dispose` when the map is torn down.
 */
export function createBenchmark(mode: Mode, tileMode: TileMode, map: Map) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const mountedAt = performance.now();
  let finished = false;
  // A tab that was hidden at any point had throttled timers and rendering, so the run is flagged hidden.
  let wasHidden = document.visibilityState === "hidden";
  const onVisibility = () => (wasHidden ||= document.visibilityState === "hidden");
  document.addEventListener("visibilitychange", onVisibility);

  performance.setResourceTimingBufferSize(BENCHMARK_RESOURCE_BUFFER);
  const protocol = registerDataProtocol(id, (reason) => finish(null, reason));

  function buildRun(readyAt: number | null, failure: string | null): BenchmarkRun {
    const tagged = performance
      .getEntriesByType("resource")
      .filter((entry) => new URL(entry.name).searchParams.get(BENCHMARK_RUN_PARAM) === id) as PerformanceResourceTiming[];
    const served = tagged.filter((entry) => !protocol.missing.has(entry.name));

    let status: BenchmarkRun["status"] = failure === null ? "ok" : "failed";
    let reason = failure ?? undefined;
    if (status === "ok" && served.length === 0) {
      status = "failed";
      reason = "no overlay data was loaded";
    }

    // Timing spans every tagged request (a missing tile is still a request); bytes and count only the served ones.
    const firstStart = tagged.length > 0 ? Math.min(...tagged.map((e) => e.startTime)) : null;
    const lastEnd = tagged.length > 0 ? Math.max(...tagged.map((e) => e.responseEnd)) : null;
    const container = map.getContainer();

    let networkMs: number | null = null;
    let afterDownloadMs: number | null = null;
    let readyMs: number | null = null;
    if (status === "ok" && firstStart !== null && lastEnd !== null && readyAt !== null) {
      networkMs = lastEnd - firstStart;
      afterDownloadMs = readyAt - lastEnd;
      readyMs = readyAt - firstStart;
    }

    return {
      id,
      mode,
      variant: variantOf(mode, tileMode),
      timestamp: Date.now(),
      status,
      ...(reason ? { reason } : {}),
      bytes: served.reduce((sum, e) => sum + e.encodedBodySize, 0),
      requests: served.length,
      missingFiles: tagged.length - served.length,
      files: served.map((e) => ({
        url: e.name.split("?")[0]!.replace(window.location.origin, ""),
        bytes: e.encodedBodySize,
      })),
      startupDelayMs: firstStart === null ? null : firstStart - mountedAt,
      networkMs,
      afterDownloadMs,
      readyMs,
      viewport: { width: container.clientWidth, height: container.clientHeight },
      visibility: wasHidden ? "hidden" : document.visibilityState,
      userAgent: navigator.userAgent,
    };
  }

  // Ready = the roads source is loaded, and in GeoJSON mode the ward source too (the tile modes carry the wards in the
  // tiles), when the map next goes idle.
  const onIdle = () => {
    const wardsLoaded = !map.getSource(WARDS_SOURCE_ID) || map.isSourceLoaded(WARDS_SOURCE_ID);
    if (map.getSource(ROADS_SOURCE_ID) && map.isSourceLoaded(ROADS_SOURCE_ID) && wardsLoaded) void finish(performance.now(), null);
  };
  // Only errors of the data sources fail the run; basemap tile and glyph errors are not part of the comparison.
  const onError = (event: ErrorEvent & { sourceId?: string }) => {
    if (event.sourceId === ROADS_SOURCE_ID || event.sourceId === WARDS_SOURCE_ID) {
      void finish(null, `source error: ${event.error?.message ?? "unknown"}`);
    }
  };
  const timer = setTimeout(() => finish(null, `timeout after ${BENCHMARK_TIMEOUT_MS / 1000} s`), BENCHMARK_TIMEOUT_MS);
  map.on("idle", onIdle);
  map.on("error", onError);

  function cleanup() {
    finished = true;
    clearTimeout(timer);
    map.off("idle", onIdle);
    map.off("error", onError);
    document.removeEventListener("visibilitychange", onVisibility);
  }

  // The protocol stays registered after the run: the map keeps loading tiles when it is moved.
  async function finish(readyAt: number | null, failure: string | null) {
    if (finished) return;
    cleanup();
    const result = buildRun(readyAt, failure);
    // After the timing is fixed: the extra request cannot affect it.
    if (result.status === "ok") result.boundaryBytes = await measureBoundaryBytes();
    saveRun(result);
    saveRunToDisk(result);
    window.__benchmarkRun = result;
    console.log("[benchmark]", result);
  }

  // Tearing the page down is not a result: an unfinished run is dropped, not recorded as failed.
  function dispose() {
    if (!finished) cleanup();
    protocol.dispose();
  }

  return {
    toProtocolUrl: protocol.toProtocolUrl,
    toPmtilesSource: protocol.toPmtilesSource,
    fail: (reason: string) => finish(null, reason),
    dispose,
  };
}
