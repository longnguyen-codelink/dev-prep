import { resolve } from "node:path";

export const VIETNAM_OSM_PBF_NAME = "vietnam-260101.osm.pbf";
export const VIETNAM_OSM_PBF_URL = `https://download.geofabrik.de/asia/${VIETNAM_OSM_PBF_NAME}`;

export const DATA_DIR = resolve(import.meta.dirname, "../../../../tmp/data");

// External command-line programs the pipeline needs; `assertTools()` checks they are installed.
export const REQUIRED_TOOLS = ["osmium", "ogr2ogr"] as const;
