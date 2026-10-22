import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  ADMIN_PBF_NAME,
  DATA_DIR,
  DEFAULT_WARD_SIMPLIFY,
  HCMC_RELATION_ID,
  HCMC_WARDS_NAME,
  VIETNAM_OSM_PBF_NAME,
  WARD_ADMIN_LEVEL,
  WARD_COORDINATE_PRECISION,
  WARD_ROLE,
  WEB_MAP_DIR,
} from "../helpers/constants.ts";
import { gzippedSize } from "../helpers/files.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools, runTool } from "../helpers/shell-tools.ts";
import { formatBytes, formatDuration, tryCatch } from "../helpers/utils.ts";

type Feature = { geometry: { type: string; coordinates: unknown } | null; properties: Record<string, unknown> };
type FeatureCollection = { features: Feature[] };

// Usage: see EXTRACT_WARDS_USAGE in constants.ts (pnpm cli extract wards)
export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: { relation: { type: "string" }, pbf: { type: "string" }, out: { type: "string" }, simplify: { type: "string" } },
  });

  const relationId = values.relation ?? HCMC_RELATION_ID;
  if (!/^\d+$/.test(relationId)) {
    Logger.error(`--relation must be a number, got "${relationId}"`);
    process.exit(1);
  }

  const simplify = values.simplify === undefined ? DEFAULT_WARD_SIMPLIFY : Number(values.simplify);
  if (!Number.isFinite(simplify) || simplify < 0) {
    Logger.error(`--simplify must be a number of degrees (0 or more), got "${values.simplify}"`);
    process.exit(1);
  }

  const pbf = values.pbf === undefined ? undefined : resolve(values.pbf);
  const out = resolve(values.out ?? resolve(WEB_MAP_DIR, HCMC_WARDS_NAME));

  const { error } = await tryCatch(buildWards(relationId, pbf, out, simplify));
  if (error) {
    Logger.error(`Failed to build the wards: ${(error as Error).message}`);
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

/** The ids of the relation's `subarea` members, read from the relation's OPL line (members are `r<id>@<role>`). */
async function wardIds(adminPbf: string, relationId: string): Promise<string[]> {
  const { stdout } = await runTool("osmium", ["getid", adminPbf, `r${relationId}`, "-f", "opl"], { label: "read relation" });
  const line = stdout.split("\n").find((entry) => entry.startsWith(`r${relationId} `));
  if (!line) throw new Error(`relation ${relationId} is not in ${adminPbf}`);

  // OPL fields are separated by spaces (spaces inside values are escaped); the members field starts with "M".
  const members = line.split(" ").find((field) => field.startsWith("M"));
  const ids = (members?.slice(1).split(",") ?? []).flatMap((member) => {
    const [ref, role] = member.split("@");
    return ref?.startsWith("r") && role === WARD_ROLE ? [ref.slice(1)] : [];
  });
  if (ids.length === 0) throw new Error(`relation ${relationId} has no "${WARD_ROLE}" members`);
  return ids;
}

async function buildWards(relationId: string, pbf: string | undefined, out: string, simplify: number): Promise<void> {
  await assertTools();
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(dirname(out), { recursive: true });

  // The admin extract is shared with `extract boundary`; it is only rebuilt when it is missing or a base file is given.
  const adminPbf = resolve(DATA_DIR, ADMIN_PBF_NAME);
  let toolMs = 0;
  if (pbf !== undefined || !existsSync(adminPbf)) {
    const source = pbf ?? resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME);
    if (!existsSync(source)) throw new Error(`PBF not found: ${source} (run \`pnpm cli fetch base-file\` first)`);
    const filter = await runTool("osmium", ["tags-filter", source, "r/boundary=administrative", "-o", adminPbf, "--overwrite"], {
      label: "filter boundaries",
    });
    toolMs += filter.ms;
  } else {
    Logger.info(`using the existing ${adminPbf}`);
  }

  const ids = await wardIds(adminPbf, relationId);
  Logger.info(`relation ${relationId}: ${ids.length} "${WARD_ROLE}" members`);

  const temp = `${out}.tmp`;
  await rm(temp, { force: true });
  try {
    // osm_id is text in the multipolygons layer, so the ids are quoted.
    const exported = await runTool(
      "ogr2ogr",
      [
        "-f",
        "GeoJSON",
        "-lco",
        "RFC7946=YES",
        "-lco",
        `COORDINATE_PRECISION=${WARD_COORDINATE_PRECISION}`,
        "-simplify",
        String(simplify),
        temp,
        adminPbf,
        "multipolygons",
        "-where",
        `osm_id IN (${ids.map((id) => `'${id}'`).join(",")})`,
        "-select",
        "osm_id,name,admin_level",
      ],
      { label: "export wards" },
    );
    toolMs += exported.ms;

    // ogr2ogr succeeds with an empty or partial result, so check what came out.
    const geojson = JSON.parse(await readFile(temp, "utf8")) as FeatureCollection;
    if (geojson.features.length !== ids.length) {
      throw new Error(`expected ${ids.length} features (one per member), found ${geojson.features.length}`);
    }

    let vertices = 0;
    const bbox = [Infinity, Infinity, -Infinity, -Infinity];
    const kinds = new Map<string, number>();
    const features = geojson.features.map((feature) => {
      const { osm_id: osmId, name, admin_level: level } = feature.properties;
      const label = `ward ${String(osmId)}`;
      if (typeof name !== "string" || name === "") throw new Error(`${label} has no name`);
      if (level !== WARD_ADMIN_LEVEL) throw new Error(`${label} "${name}" has admin_level ${String(level)}, expected ${WARD_ADMIN_LEVEL}`);
      if (feature.geometry?.type !== "Polygon" && feature.geometry?.type !== "MultiPolygon") {
        throw new Error(`${label} "${name}": expected a Polygon or MultiPolygon, got ${feature.geometry?.type ?? "no geometry"}`);
      }

      walkPositions(feature.geometry.coordinates, ([lng, lat]) => {
        vertices++;
        bbox[0] = Math.min(bbox[0]!, lng!);
        bbox[1] = Math.min(bbox[1]!, lat!);
        bbox[2] = Math.max(bbox[2]!, lng!);
        bbox[3] = Math.max(bbox[3]!, lat!);
      });
      const kind = /^(Phường|Xã|Đặc khu)/.exec(name)?.[1] ?? "other";
      kinds.set(kind, (kinds.get(kind) ?? 0) + 1);

      // Only what the map needs: the id and the name.
      return { type: "Feature", properties: { osm_id: osmId, name }, geometry: feature.geometry };
    });

    // Written compact on purpose, like the boundary.
    await writeFile(temp, JSON.stringify({ type: "FeatureCollection", features }));
    await rename(temp, out);

    const { size } = await stat(out);
    Logger.info(`${features.length} wards (${[...kinds].map(([kind, count]) => `${count} ${kind}`).join(", ")}), ${vertices} vertices`);
    Logger.info(`bbox [${bbox.map((n) => n.toFixed(3)).join(", ")}]`);
    Logger.info(`saved ${out} (${formatBytes(size)}, ${formatBytes(await gzippedSize(out))} gzipped) in ${formatDuration(toolMs)} of tool time`);
  } finally {
    await rm(temp, { force: true });
  }
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
