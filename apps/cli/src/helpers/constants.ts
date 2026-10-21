import { resolve } from "node:path";
import type { TileSettings } from "./tiles.ts"; // type only, erased at runtime, so no import cycle

export const VIETNAM_OSM_PBF_NAME = "vietnam-260101.osm.pbf";
export const VIETNAM_OSM_PBF_URL = `https://download.geofabrik.de/asia/${VIETNAM_OSM_PBF_NAME}`;

export const DATA_DIR = resolve(import.meta.dirname, "../../../../tmp/data");

// Intermediate and output file names inside DATA_DIR.
export const ADMIN_PBF_NAME = "vn-admin.osm.pbf";
export const HIGHWAYS_PBF_NAME = "vn-highways.osm.pbf";
export const HCMC_BOUNDARY_NAME = "hcmc-boundary.geojson";

// OSM relation of Ho Chi Minh City in the pinned snapshot (the merged city).
export const HCMC_RELATION_ID = "1973756";

// Where the web app reads its data files from in development (gitignored).
export const WEB_MAP_DIR = resolve(import.meta.dirname, "../../../web/public/map");

// External command-line programs the pipeline needs; `assertTools()` checks they are installed.
export const REQUIRED_TOOLS = ["osmium", "ogr2ogr", "tippecanoe"] as const;

// Largest output a tool may print before runTool() fails (the Node default of 1 MB is too small).
export const MAX_BUFFER_BYTES = 64 * 1024 * 1024;

// osmium extract strategies. `complete_ways` keeps roads that cross the boundary whole, but needs more
// than 3 GiB for all of Vietnam's roads. `simple` needs almost no memory and cuts roads at the
// polygon's edge (about 0.2% fewer features for the merged HCMC), so it is the default.
export const EXTRACT_STRATEGIES = ["simple", "complete_ways", "smart"] as const;
export const DEFAULT_EXTRACT_STRATEGY = "simple";

// ogr2ogr writes one feature per line, so counting lines with this prefix counts features cheaply.
export const FEATURE_LINE_PREFIX = '{ "type": "Feature"';

// --- Vector tiles (Week 2) ---
export const TILES_DIR = resolve(DATA_DIR, "tiles");
export const TILE_LAYER_NAME = "roads";
export const ROADS_GEOJSON_NAME = "hcmc-roads.geojson";

// Attributes kept in the tiles; osm_id, z_order and the bulky other_tags are dropped.
export const TILE_ATTRIBUTES = ["highway", "name"] as const;
export const TILE_MIN_ZOOM = 8;
export const TILE_MAX_ZOOM = 16;

// Zoom from which each highway class appears; a `_link` follows its parent class.
export const HIGHWAY_MIN_ZOOM: Record<string, number> = {
  motorway: 8,
  trunk: 8,
  primary: 8,
  secondary: 10,
  tertiary: 12,
  residential: 13,
  unclassified: 13,
  service: 14,
};
export const DEFAULT_HIGHWAY_MIN_ZOOM = 15; // footway, path, track, pedestrian, steps, cycleway, others

export const TILES_USAGE =
  "usage: pnpm cli build tiles --name <folder name> [--input <roads.geojson>] [--min-zoom N] [--max-zoom N] " +
  "[--full-detail N] [--simplification N] [--no-drop] [--no-class-zoom] [--all-attributes]";

export const BUILD_PMTILES_USAGE =
  "usage: pnpm cli build pmtiles --name <archive name> [--input <roads.geojson>] [--min-zoom N] [--max-zoom N] " +
  "[--full-detail N] [--simplification N] [--no-drop] [--no-class-zoom] [--all-attributes]";

export const SWEEP_USAGE = "usage: pnpm cli sweep tiles [--input <roads.geojson>] [--only name,name] [--keep]";

// Settings sweep: every variant changes one thing from the base (all attributes, every class from the
// lowest zoom, dropping on as a safety net), except the first (no safety net) and the last (the chosen mix).
export const SWEEP_BASE: TileSettings = {
  keepAttributes: null,
  minZoomByClass: false,
  minZoom: TILE_MIN_ZOOM,
  maxZoom: TILE_MAX_ZOOM,
  fullDetail: null,
  simplification: null,
  dropDensest: true,
};
export const SWEEP_VARIANTS: { name: string; change: string; settings: Partial<TileSettings> }[] = [
  { name: "no-dropping", change: "base without dropping features", settings: { dropDensest: false } },
  { name: "base", change: "all attributes, all classes from z8, dropping on", settings: {} },
  { name: "prune", change: "keep only highway and name", settings: { keepAttributes: TILE_ATTRIBUTES } },
  { name: "class-zoom", change: "road classes appear by zoom", settings: { minZoomByClass: true } },
  { name: "detail-10", change: "--full-detail 10 (default 12)", settings: { fullDetail: 10 } },
  { name: "simplify-4", change: "--simplification 4", settings: { simplification: 4 } },
  { name: "max-zoom-14", change: "maximum zoom 14 instead of 16", settings: { maxZoom: 14 } },
  { name: "chosen", change: "prune + class zoom + dropping (the defaults)", settings: { keepAttributes: TILE_ATTRIBUTES, minZoomByClass: true } },
];

export const CHECK_TILES_USAGE =
  "usage: pnpm cli check tiles --name <folder name> [--limit <max gzipped tile bytes>] [--view lng,lat,zoom,width,height]";

// Budgets from the track: every compressed tile at most 500 KB; the initial view at most about 3 MB.
export const MAX_TILE_GZIP_BYTES = 500_000;
export const INITIAL_VIEW_BUDGET_BYTES = 3_000_000;

// The "initial view" used for the budget check (center is [lng, lat]); MapLibre requests 512 px vector tiles.
export const INITIAL_VIEW = { center: [106.7, 10.78] as [number, number], zoom: 12, width: 1280, height: 720 };
export const MAPLIBRE_TILE_SIZE = 512;

// --- Command line ---
export const FETCH_BASE_FILE_USAGE = "usage: pnpm cli fetch base-file";
export const EXTRACT_BOUNDARY_USAGE = "usage: pnpm cli extract boundary [--relation <osm id>] [--pbf <file>] [--out <file>]";
export const BUILD_ROADS_USAGE = "usage: pnpm cli build roads --boundary <polygon.geojson> --name <output name> [--pbf <file>] [--strategy <name>]";

// Every command: `pnpm cli <action> <target>`. `file` is in src/entrypoints/ and exports run(args); the numbers
// in the file names are the pipeline order, so only this table needs to know them.
export const COMMANDS: readonly { action: string; target: string; file: string; description: string; usage: string }[] = [
  {
    action: "fetch",
    target: "base-file",
    file: "01-fetch-base-file.ts",
    description: "Download the OSM base file (the Vietnam snapshot)",
    usage: FETCH_BASE_FILE_USAGE,
  },
  {
    action: "extract",
    target: "boundary",
    file: "02-extract-boundary.ts",
    description: "Extract the HCMC boundary GeoJSON",
    usage: EXTRACT_BOUNDARY_USAGE,
  },
  { action: "build", target: "roads", file: "03-build-roads.ts", description: "Build the roads GeoJSON inside a boundary", usage: BUILD_ROADS_USAGE },
  { action: "build", target: "tiles", file: "04-build-tiles.ts", description: "Prepare the features and run tippecanoe", usage: TILES_USAGE },
  {
    action: "build",
    target: "pmtiles",
    file: "07-build-pmtiles.ts",
    description: "Build one PMTiles archive with the same tiles as the folder",
    usage: BUILD_PMTILES_USAGE,
  },
  {
    action: "check",
    target: "tiles",
    file: "05-check-tiles.ts",
    description: "Check the tile and initial-view size budgets",
    usage: CHECK_TILES_USAGE,
  },
  {
    action: "sweep",
    target: "tiles",
    file: "06-sweep-tiles.ts",
    description: "Table of tile settings versus size (optional step)",
    usage: SWEEP_USAGE,
  },
];
