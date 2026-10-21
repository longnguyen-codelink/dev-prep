import { BASEMAP_STYLE, MAP_PATHS, ROAD_TILE_MAX_ZOOM, ROAD_TILE_MIN_ZOOM, TILES_METADATA_TIMEOUT_MS } from "@/constants";

const ENV_KEYS = ["MAP_HOST", "BASEMAP_STYLE_URL"] as const;

const windowEnv = (): unknown => (typeof window === "undefined" ? undefined : window.__ENV__);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== "object" || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const isHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export function readEnv(raw: unknown = windowEnv()): RuntimeEnv {
  const env: RuntimeEnv = {};
  if (!isPlainObject(raw)) return env;
  for (const key of ENV_KEYS) {
    const value = raw[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (trimmed) env[key] = trimmed;
  }
  return env;
}

export function resolveMapHost(host?: string): string {
  const value = host?.trim() ?? "";
  if (!value) return "";
  const invalid = new Error(
    `MAP_HOST must be an http(s) URL (an origin, optionally followed by a path prefix, no query or hash) like https://maps.example.com or https://host/prefix, got "${value}"`,
  );
  if (!isHttpUrl(value)) throw invalid;
  const url = new URL(value);
  if (url.search || url.hash) throw invalid;
  return (url.origin + url.pathname).replace(/\/+$/, "");
}

export function buildMapUrls(mapHost: string) {
  const base = mapHost.replace(/\/+$/, "");
  return {
    roadsGeoJson: base + MAP_PATHS.roadsGeoJson,
    boundaryGeoJson: base + MAP_PATHS.boundaryGeoJson,
    roadTiles: base + MAP_PATHS.roadTiles,
    tilesMetadata: base + MAP_PATHS.tilesMetadata,
    roadPmtiles: base + MAP_PATHS.roadPmtiles,
  };
}

export function resolveBasemapStyle(value?: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return BASEMAP_STYLE;
  if (!isHttpUrl(trimmed)) throw new Error(`BASEMAP_STYLE_URL must be an http(s) URL, got "${trimmed}"`);
  return trimmed;
}

export function getConfig(raw: unknown = windowEnv()) {
  const env = readEnv(raw);
  const mapHost = resolveMapHost(env.MAP_HOST);
  return {
    mapHost,
    urls: buildMapUrls(mapHost),
    basemapStyleUrl: resolveBasemapStyle(env.BASEMAP_STYLE_URL),
  };
}

const parseZoom = (json: unknown, key: "minzoom" | "maxzoom"): number => {
  const raw = isPlainObject(json) ? json[key] : undefined;
  const value = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
  if (!Number.isInteger(value) || value < 0 || value > 24) throw new Error(`${key} is missing or not an integer from 0 to 24`);
  return value;
};

export async function loadTileZoomRange(metadataUrl: string, fetchFn: typeof fetch = fetch): Promise<{ min: number; max: number }> {
  try {
    const response = await fetchFn(metadataUrl, { signal: AbortSignal.timeout(TILES_METADATA_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json: unknown = await response.json();
    const min = parseZoom(json, "minzoom");
    const max = parseZoom(json, "maxzoom");
    if (min > max) throw new Error(`minzoom ${min} is greater than maxzoom ${max}`);
    return { min, max };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Tile zoom limits unavailable from ${metadataUrl} (${reason}); using ${ROAD_TILE_MIN_ZOOM}-${ROAD_TILE_MAX_ZOOM}`);
    return { min: ROAD_TILE_MIN_ZOOM, max: ROAD_TILE_MAX_ZOOM };
  }
}
