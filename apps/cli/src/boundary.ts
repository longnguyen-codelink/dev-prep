import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  ADMIN_PBF_NAME,
  DATA_DIR,
  HCMC_BOUNDARY_NAME,
  HCMC_RELATION_ID,
  VIETNAM_OSM_PBF_NAME,
} from "./helpers/constants.ts";
import { Logger } from "./helpers/logger.ts";
import { assertTools, runTool } from "./helpers/shell-tools.ts";
import { formatDuration, tryCatch } from "./helpers/utils.ts";

type Feature = { geometry: { type: string; coordinates: unknown }; properties: Record<string, unknown> };
type FeatureCollection = { features: Feature[] };

main().catch((error) => {
  Logger.error(`Unexpected error: ${(error as Error).message}`);
  process.exit(1);
});

// Usage: boundary.ts [--relation <osm id>] [--pbf <file>] [--out <file>]
async function main() {
  const { values } = parseArgs({
    options: { relation: { type: "string" }, pbf: { type: "string" }, out: { type: "string" } },
  });

  const relationId = values.relation ?? HCMC_RELATION_ID;
  if (!/^\d+$/.test(relationId)) {
    Logger.error(`--relation must be a number, got "${relationId}"`);
    process.exit(1);
  }

  const pbf = resolve(values.pbf ?? resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME));
  const out = resolve(values.out ?? resolve(DATA_DIR, HCMC_BOUNDARY_NAME));

  const { error } = await tryCatch(buildBoundary(relationId, pbf, out));
  if (error) {
    Logger.error(`Failed to build the boundary: ${(error as Error).message}`);
    process.exit(1);
  }
}

/** Calls `visit` with every [lng, lat] position, however deeply the coordinates are nested. */
function walkPositions(coordinates: unknown, visit: (position: number[]) => void): void {
  if (!Array.isArray(coordinates)) return;
  if (typeof coordinates[0] === "number") {
    visit(coordinates as number[]);
    return;
  }
  for (const part of coordinates) walkPositions(part, visit);
}

async function buildBoundary(relationId: string, pbf: string, out: string): Promise<void> {
  if (!existsSync(pbf)) throw new Error(`PBF not found: ${pbf} (run fetch-vietnam first)`);
  await assertTools();
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(dirname(out), { recursive: true });

  const adminPbf = resolve(DATA_DIR, ADMIN_PBF_NAME);
  const temp = `${out}.tmp`;
  await rm(temp, { force: true });

  try {
    const filter = await runTool(
      "osmium",
      ["tags-filter", pbf, "r/boundary=administrative", "-o", adminPbf, "--overwrite"],
      { label: "filter boundaries" },
    );
    const exported = await runTool(
      "ogr2ogr",
      [
        "-f", "GeoJSON", "-lco", "RFC7946=YES", temp, adminPbf, "multipolygons",
        "-where", `osm_id='${relationId}'`,
        "-select", "osm_id,name,admin_level",
      ],
      { label: "export boundary" },
    );

    // ogr2ogr succeeds with an empty result when nothing matches, so check what came out.
    const geojson = JSON.parse(await readFile(temp, "utf8")) as FeatureCollection;
    if (geojson.features.length !== 1) {
      throw new Error(`expected exactly 1 feature for relation ${relationId}, found ${geojson.features.length}`);
    }
    const feature = geojson.features[0]!;
    // GDAL may write a one-part MultiPolygon as a Polygon (it does with RFC7946=YES); both are valid polygons.
    if (feature.geometry.type !== "Polygon" && feature.geometry.type !== "MultiPolygon") {
      throw new Error(`expected a Polygon or MultiPolygon, got ${feature.geometry.type}`);
    }
    const name = feature.properties.name;
    if (typeof name !== "string" || name === "") throw new Error(`relation ${relationId} has no name`);

    let vertices = 0;
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    walkPositions(feature.geometry.coordinates, ([lng, lat]) => {
      vertices++;
      bbox[0] = Math.min(bbox[0]!, lng!);
      bbox[1] = Math.min(bbox[1]!, lat!);
      bbox[2] = Math.max(bbox[2]!, lng!);
      bbox[3] = Math.max(bbox[3]!, lat!);
    });

    // Written compact on purpose: pretty-printed GeoJSON is several times larger.
    await writeFile(temp, JSON.stringify(geojson));
    await rename(temp, out);

    const { size } = await stat(out);
    Logger.info(`relation ${relationId}: "${name}", ${feature.geometry.type}, ${vertices} vertices`);
    Logger.info(`bbox [${bbox.map((n) => n.toFixed(3)).join(", ")}]`);
    Logger.info(`saved ${out} (${size} bytes) in ${formatDuration(filter.ms + exported.ms)} of tool time`);
  } finally {
    await rm(temp, { force: true });
  }
}
