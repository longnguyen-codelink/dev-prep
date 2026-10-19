import { resolve } from "node:path";

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
export const REQUIRED_TOOLS = ["osmium", "ogr2ogr"] as const;

// Largest output a tool may print before runTool() fails (the Node default of 1 MB is too small).
export const MAX_BUFFER_BYTES = 64 * 1024 * 1024;

// osmium extract strategies. `complete_ways` keeps roads that cross the boundary whole, but needs more
// than 3 GiB for all of Vietnam's roads. `simple` needs almost no memory and cuts roads at the
// polygon's edge (about 0.2% fewer features for the merged HCMC), so it is the default.
export const EXTRACT_STRATEGIES = ["simple", "complete_ways", "smart"] as const;
export const DEFAULT_EXTRACT_STRATEGY = "simple";

// ogr2ogr writes one feature per line, so counting lines with this prefix counts features cheaply.
export const FEATURE_LINE_PREFIX = '{ "type": "Feature"';
