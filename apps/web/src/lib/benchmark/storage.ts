import { BENCHMARK_STORAGE_KEY } from "@/constants";
import type { RoadsMode } from "@/lib/map-layers";

import type { BenchmarkRun } from "./types";

const keyFor = (mode: RoadsMode) => `${BENCHMARK_STORAGE_KEY}-${mode}`;

export function loadRuns(mode: RoadsMode): BenchmarkRun[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(keyFor(mode)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as BenchmarkRun[]) : [];
  } catch {
    return [];
  }
}

export function saveRun(run: BenchmarkRun): void {
  try {
    localStorage.setItem(keyFor(run.mode), JSON.stringify([...loadRuns(run.mode), run]));
  } catch {
    // Storage can be blocked or full; the run is still on window.__benchmarkRun.
  }
}
