// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

import type { LngLatLike } from "maplibre-gl";

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER: LngLatLike = [106.7, 10.78];
export const START_ZOOM = 12;

// Raw baseline: all HCMC roads as one GeoJSON file (loaded in GeoJSON mode).
export const BIG_ROADS_URL = "./map/hcmc-roads.geojson";

// Vector tiles built by apps/cli (tmp/data/tiles/hcmc-roads, linked into public/map/tiles in development).
export const ROAD_TILES_URL = "/map/tiles/{z}/{x}/{y}.pbf";
export const ROAD_TILE_MIN_ZOOM = 8;
export const ROAD_TILE_MAX_ZOOM = 16;

// Benchmark mode (?benchmark) renders the map in a fixed box so every run has the same viewport.
export const BENCHMARK_MAP_WIDTH = 1280;
export const BENCHMARK_MAP_HEIGHT = 720;

// Overlay data goes through this MapLibre protocol so its requests run on the main thread (visible to Resource Timing).
export const BENCHMARK_PROTOCOL = "bench";
export const BENCHMARK_RUN_PARAM = "benchmark-run";
export const BENCHMARK_TIMEOUT_MS = 120_000;
// Runs are stored per mode under "<key>-<mode>"; bump the version when the run shape changes.
export const BENCHMARK_STORAGE_KEY = "dev-prep-benchmark-runs-v1";
// The default buffer (250) could fill with basemap requests before the overlay data is read back.
export const BENCHMARK_RESOURCE_BUFFER = 1000;

export const HCMC_URL = "./map/hcmc-boundary.geojson";

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
