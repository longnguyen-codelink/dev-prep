// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do): central Ho Chi Minh City
export const START_CENTER = [106.7, 10.78];
export const START_ZOOM = 12;

export const CITADEL_ROADS_URL = "./data/gia-dinh-roads.geojson";
export const CITADEL_OUTLINE_URL = "./data/gia-dinh-citadel.geojson";

// Raw baseline: all HCMC roads as one GeoJSON file (loaded only when the toggle is switched on).
export const BIG_ROADS_URL = "./data/hcmc-roads.geojson";
