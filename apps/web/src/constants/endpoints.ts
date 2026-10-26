// MAP_HOST comes from /env-config.js at runtime: an http(s) origin, optionally followed by a path prefix
// (e.g. https://example.com/public/dev-challenge-gis). Empty = same origin (dev: public/map).
const mapHost = (window.__ENV__?.MAP_HOST ?? "").replace(/\/+$/, "");

export const MAP_URLS = {
  roadsGeoJson: `${mapHost}/map/hcmc-roads.geojson`,
  boundaryGeoJson: `${mapHost}/map/hcmc-boundary.geojson`,
  wardsGeoJson: `${mapHost}/map/hcmc-wards.geojson`,
  poiGeoJson: `${mapHost}/map/hcmc-poi.geojson`,
  // Roads and wards are one set of tiles (source-layers `roads` and `wards`), built by `pnpm cli build tiles` / `build pmtiles`.
  tiles: `${mapHost}/map/tiles-roads-wards/{z}/{x}/{y}.pbf`,
  pmtiles: `${mapHost}/map/hcmc-roads-wards.pmtiles`,
} as const;

// BUILD_COMMIT and BUILD_REPO_URL come from /env-config.js too (CI sets them). Validated before use so the
// link is never built from a malformed value; anything missing or invalid gives null and the chip is hidden.
const buildCommit = (window.__ENV__?.BUILD_COMMIT ?? "dev").trim();
const buildRepoUrl = (window.__ENV__?.BUILD_REPO_URL ?? "https://example.com").trim().replace(/\/$/, "");

const isValidBuildCommit = (commit: string) => /^[0-9a-f]{7,40}$/i.test(commit) || commit === "dev";
export const BUILD_INFO =
  isValidBuildCommit(buildCommit) && buildRepoUrl.startsWith("https://")
    ? { shortHash: buildCommit.slice(0, 7), url: `${buildRepoUrl}/commit/${buildCommit}` }
    : null;
