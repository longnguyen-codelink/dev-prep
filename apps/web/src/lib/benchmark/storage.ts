import { ref } from "vue";

import { BENCHMARK_STORAGE_KEY, MODES, type Mode, TILE_MODES, type TileMode, VARIANTS, type Variant } from "@/constants";

import type { BenchmarkRun } from "./types";

// The variant a run is benchmarked as: GeoJSON mode, PM Tiles, or the folder tiles.
export function variantOf(mode: Mode, tileMode: TileMode): Variant {
  if (mode === MODES.GEOJSON) return VARIANTS.GEOJSON;
  return tileMode === TILE_MODES.PM_TILES ? VARIANTS.PM_TILES : VARIANTS.FOLDER;
}

// Runs recorded before PM Tiles existed live under the folder suffix "tiles".
const keyFor = (variant: Variant) => `${BENCHMARK_STORAGE_KEY}-${variant === VARIANTS.FOLDER ? "tiles" : variant}`;

// Runs stored before the variant field existed: GeoJSON by mode, otherwise folder.
const variantFallback = (run: BenchmarkRun): Variant => (run.mode.toLowerCase() === "geojson" ? VARIANTS.GEOJSON : VARIANTS.FOLDER);

// Bumped after every write so the panel can recompute without polling or a reload.
export const runsVersion = ref(0);

export function loadRuns(variant: Variant): BenchmarkRun[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(keyFor(variant)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as BenchmarkRun[]) : [];
  } catch {
    return [];
  }
}

export function saveRun(run: BenchmarkRun): void {
  const variant = run.variant ?? variantFallback(run);
  try {
    localStorage.setItem(keyFor(variant), JSON.stringify([...loadRuns(variant), run]));
  } catch {
    // Storage can be blocked or full; the run is still on window.__benchmarkRun.
  }
  runsVersion.value++;
}

export function clearRuns(variant: Variant): void {
  try {
    localStorage.removeItem(keyFor(variant));
  } catch {
    // Nothing stored if storage is blocked.
  }
  runsVersion.value++;
}
