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

// What is benchmarked: GeoJSON, tiles from a folder, or tiles from a PM Tiles archive.
export const VARIANTS = { GEOJSON: "geojson", FOLDER: "folder", PM_TILES: "pmtiles" } as const;
export type Variant = (typeof VARIANTS)[keyof typeof VARIANTS];

// Overlay layer groups: each overlay layer carries one in its metadata, and the layers select switches whole groups.
export const LAYER_GROUPS = {
  BOUNDARY: "boundary",
  WARDS: "wards",
  ROADS: "roads",
} as const;
export type LayerGroup = (typeof LAYER_GROUPS)[keyof typeof LAYER_GROUPS];

export const LAYER_GROUP_LABELS: Record<LayerGroup, string> = {
  [LAYER_GROUPS.BOUNDARY]: "Boundary",
  [LAYER_GROUPS.WARDS]: "Wards",
  [LAYER_GROUPS.ROADS]: "Roads",
};

// Ward outlines are drawn from this zoom, their names from WARD_LABEL_MIN_ZOOM (a layer is hidden below its minzoom).
export const WARD_OUTLINE_MIN_ZOOM = 10;
export const WARD_LABEL_MIN_ZOOM = 12;

// The wards' layer in the vector tiles (apps/cli TILE_WARD_LAYER_NAME; the roads' layer is "roads"). Their tiles start at
// zoom 10, the same as WARD_OUTLINE_MIN_ZOOM.
export const WARDS_SOURCE_LAYER = "wards";

// URL parameter holding the difference from the defaults, e.g. ?layers=-roads,+wards.
export const LAYERS_PARAM = "layers";

// Wards are off until asked for, so the default view is the same as before the groups existed.
// Every benchmark run draws all groups, so the three variants carry and draw the same content (roads and wards).
export const BENCHMARK_LAYER_GROUPS: readonly LayerGroup[] = [LAYER_GROUPS.BOUNDARY, LAYER_GROUPS.WARDS, LAYER_GROUPS.ROADS];

export const DEFAULT_LAYER_GROUPS: readonly LayerGroup[] = [LAYER_GROUPS.BOUNDARY, LAYER_GROUPS.ROADS];

export const BASEMAP_STYLE ="https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER: LngLatLike = [106.7, 10.78];
export const START_ZOOM = 12;

// Zoom range of the tile build (same as apps/cli TILE_MIN_ZOOM / TILE_MAX_ZOOM).
export const ROAD_TILE_MIN_ZOOM = 8;
export const ROAD_TILE_MAX_ZOOM = 16;

// GeoJSON mode has no tile build, so it applies the same per-class zoom rules itself.
// Mirrors apps/cli HIGHWAY_MIN_ZOOM / DEFAULT_HIGHWAY_MIN_ZOOM; keep them in step. A _link follows its parent class.
export const ROAD_CLASS_MIN_ZOOM: Record<string, number> = {
  motorway: 8,
  trunk: 8,
  primary: 8,
  secondary: 10,
  tertiary: 12,
  residential: 13,
  unclassified: 13,
  service: 14,
};
export const DEFAULT_ROAD_MIN_ZOOM = 15;

// Roads are thin lines, so a click within this many pixels of a road counts as a hit on it.
export const ROAD_CLICK_TOLERANCE_PX = 6;

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
// Runs are stored per variant under "<key>-<variant>"; bump the version when the run shape changes.
// v2: runs recorded with the wards drawn in every variant (roads + wards). v1 holds the older roads-only runs, which are not
// comparable and are never mixed in.
export const BENCHMARK_STORAGE_KEY = "dev-prep-benchmark-runs-v2";
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

// The drawn overlay layers, as the active-layers badges list them: one entry can be several map layers (the city
// outline and fill, the three GeoJSON-mode layers of a road tier). `colors` are the CSS variables the layers are
// painted with, so the badges and the map take their colours from the same place; a ward's fill is one of five.
// `minZoom` is the zoom from which the entry is drawn (the first class of a road tier; the tiles use the same rules).
export const LAYER_ENTRIES = [
  { key: "city", group: LAYER_GROUPS.BOUNDARY, label: "City boundary", colors: [cssVariableMap.chart1], minZoom: 0 },
  {
    key: "ward-fill",
    group: LAYER_GROUPS.WARDS,
    label: "Ward fill",
    colors: [cssVariableMap.chart1, cssVariableMap.chart2, cssVariableMap.chart3, cssVariableMap.chart4, cssVariableMap.chart5],
    minZoom: WARD_OUTLINE_MIN_ZOOM,
  },
  { key: "ward-outline", group: LAYER_GROUPS.WARDS, label: "Ward outline", colors: [cssVariableMap.foreground], minZoom: WARD_OUTLINE_MIN_ZOOM },
  { key: "ward-names", group: LAYER_GROUPS.WARDS, label: "Ward names", colors: [cssVariableMap.foreground], minZoom: WARD_LABEL_MIN_ZOOM },
  { key: "major", group: LAYER_GROUPS.ROADS, label: "Major roads", colors: [cssVariableMap.chart1], minZoom: ROAD_CLASS_MIN_ZOOM.motorway! },
  { key: "medium", group: LAYER_GROUPS.ROADS, label: "Medium roads", colors: [cssVariableMap.chart2], minZoom: ROAD_CLASS_MIN_ZOOM.secondary! },
  { key: "minor", group: LAYER_GROUPS.ROADS, label: "Minor roads", colors: [cssVariableMap.chart3], minZoom: ROAD_CLASS_MIN_ZOOM.residential! },
] as const;
export type LayerEntryKey = (typeof LAYER_ENTRIES)[number]["key"];
