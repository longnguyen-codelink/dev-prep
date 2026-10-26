import { existsSync } from "node:fs";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  DATA_DIR,
  HCMC_BOUNDARY_NAME,
  HCMC_POI_NAME,
  HCMC_POI_PBF_NAME,
  POI_COORDINATE_PRECISION,
  POI_LANDMARK_TAGS,
  POI_MAX_COUNT,
  POI_PBF_NAME,
  VIETNAM_OSM_PBF_NAME,
  WEB_MAP_DIR,
} from "../helpers/constants.ts";
import { gzippedSize } from "../helpers/files.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools, runTool } from "../helpers/shell-tools.ts";
import { formatBytes, formatDuration, tryCatch } from "../helpers/utils.ts";

type OsmiumFeature = {
  id?: string | number;
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
};

type OsmiumFeatureCollection = {
  type: string;
  features: OsmiumFeature[];
};

type PoiCandidate = {
  osmId: string;
  name: string;
  kind: string;
  priorityIndex: number;
  lng: number;
  lat: number;
  nameEn?: string;
  street?: string;
  website?: string;
};

// Usage: see EXTRACT_POI_USAGE in constants.ts (pnpm cli extract poi)
export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      boundary: { type: "string" },
      pbf: { type: "string" },
      out: { type: "string" },
    },
  });

  const boundary = resolve(values.boundary ?? resolve(WEB_MAP_DIR, HCMC_BOUNDARY_NAME));
  const pbf = resolve(values.pbf ?? resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME));
  const out = resolve(values.out ?? resolve(WEB_MAP_DIR, HCMC_POI_NAME));

  const { error } = await tryCatch(buildPoi(boundary, pbf, out));
  if (error) {
    Logger.error(`Failed to extract POIs: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function buildPoi(boundary: string, pbf: string, out: string): Promise<void> {
  if (!existsSync(boundary)) throw new Error(`boundary not found: ${boundary}`);
  if (!existsSync(pbf)) throw new Error(`PBF not found: ${pbf} (run \`pnpm cli fetch base-file\` first)`);

  await assertTools();
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(dirname(out), { recursive: true });

  const landmarksPbf = resolve(DATA_DIR, POI_PBF_NAME);
  const clippedPbf = resolve(DATA_DIR, HCMC_POI_PBF_NAME);
  const temp = `${out}.tmp`;
  await rm(temp, { force: true });

  let toolMs = 0;
  try {
    // Group landmark tags by key to build osmium tags-filter arguments (n/tourism=... n/amenity=...).
    const grouped = new Map<string, string[]>();
    for (const [key, value] of POI_LANDMARK_TAGS) {
      const values = grouped.get(key) ?? [];
      values.push(value);
      grouped.set(key, values);
    }
    const filterExpressions = [...grouped.entries()].map(([key, values]) => `n/${key}=${values.join(",")}`);

    const filter = await runTool("osmium", ["tags-filter", pbf, ...filterExpressions, "-o", landmarksPbf, "--overwrite"], {
      label: "filter poi nodes",
    });
    toolMs += filter.ms;

    const clip = await runTool("osmium", ["extract", "-s", "simple", "-p", boundary, landmarksPbf, "-o", clippedPbf, "--overwrite"], {
      label: "clip to boundary (simple)",
    });
    toolMs += clip.ms;

    const exported = await runTool("osmium", ["export", "-a", "id", "-f", "geojson", clippedPbf], {
      label: "export poi",
    });
    toolMs += exported.ms;

    const raw = JSON.parse(exported.stdout) as OsmiumFeatureCollection;
    const candidates: PoiCandidate[] = [];

    for (const feature of raw.features) {
      if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) {
        continue;
      }
      const [rawLng, rawLat] = feature.geometry.coordinates;
      if (typeof rawLng !== "number" || typeof rawLat !== "number") {
        continue;
      }

      const name = feature.properties.name;
      if (typeof name !== "string" || name === "") {
        continue;
      }

      let priorityIndex = -1;
      let kind = "";
      for (let i = 0; i < POI_LANDMARK_TAGS.length; i++) {
        const [tagKey, tagValue] = POI_LANDMARK_TAGS[i]!;
        if (feature.properties[tagKey] === tagValue) {
          priorityIndex = i;
          kind = tagValue;
          break;
        }
      }
      if (priorityIndex === -1) {
        continue;
      }

      const rawId = feature.properties["@id"] ?? feature.id ?? feature.properties.osm_id;
      if (typeof rawId !== "string" && typeof rawId !== "number") {
        throw new Error(`feature "${name}" has no OSM ID`);
      }
      const osmId = String(rawId);

      const nameEn =
        typeof feature.properties["name:en"] === "string" && feature.properties["name:en"] !== "" ? feature.properties["name:en"] : undefined;
      const street =
        typeof feature.properties["addr:street"] === "string" && feature.properties["addr:street"] !== ""
          ? feature.properties["addr:street"]
          : undefined;
      const website = typeof feature.properties.website === "string" && feature.properties.website !== "" ? feature.properties.website : undefined;

      const lng = Number(rawLng.toFixed(POI_COORDINATE_PRECISION));
      const lat = Number(rawLat.toFixed(POI_COORDINATE_PRECISION));

      candidates.push({
        osmId,
        name,
        kind,
        priorityIndex,
        lng,
        lat,
        nameEn,
        street,
        website,
      });
    }

    candidates.sort((a, b) => {
      if (a.priorityIndex !== b.priorityIndex) {
        return a.priorityIndex - b.priorityIndex;
      }
      if (a.name !== b.name) {
        return a.name < b.name ? -1 : 1;
      }
      return a.osmId < b.osmId ? -1 : a.osmId > b.osmId ? 1 : 0;
    });

    const selected = candidates.slice(0, POI_MAX_COUNT);
    if (selected.length === 0) {
      throw new Error("no POI features matched the selection rules (is the boundary in Vietnam?)");
    }

    const kinds = new Map<string, number>();
    const features = selected.map((item) => {
      kinds.set(item.kind, (kinds.get(item.kind) ?? 0) + 1);

      const properties: Record<string, string> = {
        osm_id: item.osmId,
        name: item.name,
        kind: item.kind,
      };
      if (item.nameEn !== undefined) properties.name_en = item.nameEn;
      if (item.street !== undefined) properties.street = item.street;
      if (item.website !== undefined) properties.website = item.website;

      return {
        type: "Feature",
        properties,
        geometry: {
          type: "Point",
          coordinates: [item.lng, item.lat],
        },
      };
    });

    // Written compact on purpose, like the boundary and wards.
    await writeFile(temp, JSON.stringify({ type: "FeatureCollection", features }));
    await rename(temp, out);

    const { size } = await stat(out);
    const gzipped = await gzippedSize(out);
    const kindSummary = [...kinds.entries()].map(([kind, count]) => `${count} ${kind}`).join(", ");
    Logger.info(`${features.length} POIs (${kindSummary})`);
    Logger.info(`saved ${out} (${formatBytes(size)}, ${formatBytes(gzipped)} gzipped) in ${formatDuration(toolMs)} of tool time`);
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
