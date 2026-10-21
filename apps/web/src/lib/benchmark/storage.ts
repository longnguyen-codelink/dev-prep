import { ref } from "vue";

import { BENCHMARK_STORAGE_KEY, type Mode } from "@/constants";

import type { BenchmarkRun } from "./types";

// Lower-cased so runs stored before the mode values were capitalised (old lower-case keys) still load.
const keyFor = (mode: Mode) => `${BENCHMARK_STORAGE_KEY}-${mode.toLowerCase()}`;

// Bumped after every write so the panel can recompute without polling or a reload.
export const runsVersion = ref(0);

export function loadRuns(mode: Mode): BenchmarkRun[] {
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
  runsVersion.value++;
}

export function clearRuns(mode: Mode): void {
  try {
    localStorage.removeItem(keyFor(mode));
  } catch {
    // Nothing stored if storage is blocked.
  }
  runsVersion.value++;
}
