// MAP_HOST comes from /env-config.js at runtime: an http(s) origin, optionally followed by a path prefix
// (e.g. https://storage.longngphuc.id.vn/public/dev-challenge-gis). Empty = same origin (dev: public/map).
const mapHost = (window.__ENV__?.MAP_HOST ?? "").replace(/\/+$/, "");

export const MAP_URLS = {
  roadsGeoJson: `${mapHost}/map/hcmc-roads.geojson`,
  boundaryGeoJson: `${mapHost}/map/hcmc-boundary.geojson`,
  roadTiles: `${mapHost}/map/tiles/{z}/{x}/{y}.pbf`,
  roadPmtiles: `${mapHost}/map/hcmc-roads.pmtiles`,
} as const;
