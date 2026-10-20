import type { Map } from "maplibre-gl";

import { BENCHMARK_RESOURCE_BUFFER, BENCHMARK_RUN_PARAM, BENCHMARK_TIMEOUT_MS } from "@/constants";
import type { RoadsMode } from "@/lib/map-layers";

import { registerDataProtocol } from "./protocol";
import { saveRun } from "./storage";
import type { BenchmarkRun } from "./types";

const SOURCE_ID = "roads";

/**
 * Call once per page load, in onMounted and before the map is created. Pass `toProtocolUrl` to addRoadsLayer, then
 * call `run(map)` right after the layers are added; it resolves with the stored run.
 */
export function createBenchmark(mode: RoadsMode) {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const mountedAt = performance.now();
  let fail: (reason: string) => void = () => {};
  let failedEarly: string | null = null;

  performance.setResourceTimingBufferSize(BENCHMARK_RESOURCE_BUFFER);
  const protocol = registerDataProtocol(id, (reason) => {
    failedEarly ??= reason;
    fail(reason);
  });

  function buildRun(map: Map, readyAt: number | null, failure: string | null): BenchmarkRun {
    const tagged = performance
      .getEntriesByType("resource")
      .filter((entry) =>
        entry.name.includes(`${BENCHMARK_RUN_PARAM}=${id}`),
      ) as PerformanceResourceTiming[];
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
      visibility: document.visibilityState,
      userAgent: navigator.userAgent,
    };
  }

  // Ready = the roads source reports loaded, then the next idle.
  function run(map: Map): Promise<BenchmarkRun> {
    return new Promise((resolve) => {
      let sourceLoaded = false;
      let finished = false;

      const finish = (readyAt: number | null, failure: string | null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        map.off("sourcedata", onSourceData);
        map.off("idle", onIdle);
        const result = buildRun(map, readyAt, failure);
        saveRun(result);
        window.__benchmarkRun = result;
        console.log("[benchmark]", result);
        resolve(result);
      };

      const onSourceData = (event: { sourceId?: string }) => {
        if (event.sourceId === SOURCE_ID && map.isSourceLoaded(SOURCE_ID)) sourceLoaded = true;
      };
      const onIdle = () => {
        if (sourceLoaded) finish(performance.now(), null);
      };
      const timer = setTimeout(
        () => finish(null, `timeout after ${BENCHMARK_TIMEOUT_MS / 1000} s`),
        BENCHMARK_TIMEOUT_MS,
      );

      fail = (reason) => finish(null, reason);
      if (failedEarly) return finish(null, failedEarly);
      map.on("sourcedata", onSourceData);
      map.on("idle", onIdle);
    });
  }

  return { toProtocolUrl: protocol.toProtocolUrl, run };
}
