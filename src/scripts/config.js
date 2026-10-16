// Every URL and starting view lives here, so swapping raw GeoJSON for tiles later only touches this file.

export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// [lng, lat] (kinh do, vi do). Phase 2 starts on the Gia Dinh citadel; the Phase 3 baseline
// switches back to central Ho Chi Minh City ([106.7, 10.78], zoom 12).
export const START_CENTER = [106.7017, 10.7867];
export const START_ZOOM = 15.5;

export const CITADEL_ROADS_URL = "./data/gia-dinh-roads.geojson";
export const CITADEL_OUTLINE_URL = "./data/gia-dinh-citadel.geojson";
