// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

import type { LngLatLike } from "maplibre-gl";

// Mode values double as the display labels and the ?mode= URL values.
export const MODES = {
  TILES: "Tiles",
  GEOJSON: "GeoJSON",
} as const;
export type Mode = (typeof MODES)[keyof typeof MODES];

// TileMode constants and URLs
export const TILE_MODES = {
  FOLDER: "Folder",
  PM_TILES: "PM Tiles",
} as const;
export type TileMode = (typeof TILE_MODES)[keyof typeof TILE_MODES];

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER: LngLatLike = [106.7, 10.78];
export const START_ZOOM = 12;

// Zoom range of the tile build (same as apps/cli TILE_MIN_ZOOM / TILE_MAX_ZOOM).
export const ROAD_TILE_MIN_ZOOM = 8;
export const ROAD_TILE_MAX_ZOOM = 16;

// Benchmark mode (?benchmark) renders the map in a fixed box so every run has the same viewport.
// The toolbar stays disabled until the map reports ready; this unblocks it if the map never gets there.
export const MAP_READY_TIMEOUT_MS = 60_000;

export const BENCHMARK_MAP_WIDTH = 1280;
export const BENCHMARK_MAP_HEIGHT = 720;
// The canvas is drawn at this pixel ratio in the benchmark view, whatever the display or browser zoom says.
export const BENCHMARK_PIXEL_RATIO = 1;

// Overlay data goes through this MapLibre protocol so its requests run on the main thread (visible to Resource Timing).
export const BENCHMARK_PROTOCOL = "bench";
export const BENCHMARK_RUN_PARAM = "benchmark-run";
// ?benchmark opens the benchmark view; ?benchmark&run makes that page load record one run (then drops the param).
export const BENCHMARK_VIEW_PARAM = "benchmark";
export const BENCHMARK_RECORD_PARAM = "run";
export const BENCHMARK_TIMEOUT_MS = 120_000;
// Runs are stored per mode under "<key>-<mode>"; bump the version when the run shape changes.
export const BENCHMARK_STORAGE_KEY = "dev-prep-benchmark-runs-v1";
// The default buffer (250) could fill with basemap requests before the overlay data is read back.
export const BENCHMARK_RESOURCE_BUFFER = 1000;
// In development every finished run is also POSTed here and appended to tmp/benchmark/runs.json by the Vite dev server.
export const BENCHMARK_SAVE_ENDPOINT = "/__benchmark/runs";
// Details panel hints: runs needed for a meaningful median, and a startup delay that suggests a throttled page start.
export const BENCHMARK_MIN_RUNS = 3;
export const BENCHMARK_SLOW_STARTUP_MS = 2000;

// shadcn color tokens from src/styles/global.css; resolve with cssVarToRgba() before handing to MapLibre.
export const cssVariableMap = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
  chart1: "--chart-1",
  chart2: "--chart-2",
  chart3: "--chart-3",
  chart4: "--chart-4",
  chart5: "--chart-5",
  sidebar: "--sidebar",
  sidebarForeground: "--sidebar-foreground",
  sidebarPrimary: "--sidebar-primary",
  sidebarPrimaryForeground: "--sidebar-primary-foreground",
  sidebarAccent: "--sidebar-accent",
  sidebarAccentForeground: "--sidebar-accent-foreground",
  sidebarBorder: "--sidebar-border",
  sidebarRing: "--sidebar-ring",
} as const;
