// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

import type { LngLatLike } from "maplibre-gl";

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER: LngLatLike = [106.7, 10.78];
export const START_ZOOM = 12;

// Raw baseline: all HCMC roads as one GeoJSON file (loaded only when the toggle is switched on).
export const BIG_ROADS_URL = "./data/hcmc-roads.geojson";
