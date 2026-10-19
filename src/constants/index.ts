// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

import type { LngLatLike } from "maplibre-gl";

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER: LngLatLike = [106.7, 10.78];
export const START_ZOOM = 12;

// Raw baseline: all HCMC roads as one GeoJSON file (loaded only when the toggle is switched on).
export const BIG_ROADS_URL = "./map/hcmc-roads.geojson";

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
