// MAP_HOST comes from /env-config.js at runtime: an http(s) origin, optionally followed by a path prefix
// (e.g. https://example.com/public/dev-challenge-gis). Empty = same origin (dev: public/map).
const mapHost = (window.__ENV__?.MAP_HOST ?? "").replace(/\/+$/, "");

export const MAP_URLS = {
  roadsGeoJson: `${mapHost}/map/hcmc-roads.geojson`,
  boundaryGeoJson: `${mapHost}/map/hcmc-boundary.geojson`,
  wardsGeoJson: `${mapHost}/map/hcmc-wards.geojson`,
  roadTiles: `${mapHost}/map/tiles/{z}/{x}/{y}.pbf`,
  roadPmtiles: `${mapHost}/map/hcmc-roads.pmtiles`,
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
