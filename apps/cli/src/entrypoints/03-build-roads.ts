import { existsSync, type Stats } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  DATA_DIR,
  DEFAULT_EXTRACT_STRATEGY,
  EXTRACT_STRATEGIES,
  FEATURE_LINE_PREFIX,
  HIGHWAYS_PBF_NAME,
  VIETNAM_OSM_PBF_NAME,
} from "../helpers/constants.ts";
import { countLinesStartingWith, gzippedSize } from "../helpers/files.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools, runTool } from "../helpers/shell-tools.ts";
import { formatDuration, tryCatch } from "../helpers/utils.ts";

// Usage: 03-build-roads.ts --boundary <polygon.geojson> --name <output name> [--pbf <file>] [--strategy <name>]
export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      boundary: { type: "string" },
      name: { type: "string" },
      pbf: { type: "string" },
      strategy: { type: "string" },
    },
  });

  if (!values.boundary || !values.name) {
    Logger.error("usage: 03-build-roads.ts --boundary <polygon.geojson> --name <output name> [--pbf <file>] [--strategy <name>]");
    process.exit(1);
  }
  const strategy = values.strategy ?? DEFAULT_EXTRACT_STRATEGY;
  if (!(EXTRACT_STRATEGIES as readonly string[]).includes(strategy)) {
    Logger.error(`--strategy must be one of ${EXTRACT_STRATEGIES.join(", ")}, got "${strategy}"`);
    process.exit(1);
  }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(values.name)) {
    Logger.error(`--name may only use lowercase letters, digits and dashes, got "${values.name}"`);
    process.exit(1);
  }

  const boundary = resolve(values.boundary);
  const pbf = resolve(values.pbf ?? resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME));

  const { error } = await tryCatch(buildRoads(boundary, values.name, pbf, strategy));
  if (error) {
    Logger.error(`Failed to build the roads: ${(error as Error).message}`);
    process.exit(1);
  }
}

async function requireNonEmpty(path: string, step: string): Promise<void> {
  const { data, error } = await tryCatch<Stats, Error>(stat(path));
  if (error || data.size === 0) throw new Error(`${step} produced no output: ${path}`);
}

async function buildRoads(boundary: string, name: string, pbf: string, strategy: string): Promise<void> {
  if (!existsSync(boundary)) throw new Error(`boundary not found: ${boundary}`);
  if (!existsSync(pbf)) throw new Error(`PBF not found: ${pbf} (run 01-fetch-base-file.ts first)`);
  await assertTools();
  await mkdir(DATA_DIR, { recursive: true });

  const highways = resolve(DATA_DIR, HIGHWAYS_PBF_NAME);
  const clipped = resolve(DATA_DIR, `${name}.osm.pbf`);
  const output = resolve(DATA_DIR, `${name}.geojson`);
  const temp = `${output}.tmp`;
  await rm(temp, { force: true });

  try {
    const filter = await runTool("osmium", ["tags-filter", pbf, "w/highway", "-o", highways, "--overwrite"], {
      label: "filter highways",
    });
    await requireNonEmpty(highways, "filter highways");

    // See EXTRACT_STRATEGIES in constants.ts for the difference between the strategies.
    const clip = await runTool("osmium", ["extract", "-s", strategy, "-p", boundary, highways, "-o", clipped, "--overwrite"], {
      label: `clip to boundary (${strategy})`,
    });
    await requireNonEmpty(clipped, "clip to boundary");

    const exported = await runTool("ogr2ogr", ["-f", "GeoJSON", "-lco", "RFC7946=YES", temp, clipped, "lines"], { label: "export geojson" });
    await requireNonEmpty(temp, "export geojson");

    const features = await countLinesStartingWith(temp, FEATURE_LINE_PREFIX);
    if (features === 0) throw new Error("the export has no road features (is the boundary in Vietnam?)");
    await rename(temp, output);

    const { size } = await stat(output);
    const gzipped = await gzippedSize(output);
    const total = filter.ms + clip.ms + exported.ms;
    Logger.info(`${name}: ${features} features, ${size} bytes (${gzipped} bytes gzipped)`);
    Logger.info(
      `filter ${formatDuration(filter.ms)}, clip ${formatDuration(clip.ms)}, export ${formatDuration(exported.ms)}, total ${formatDuration(total)}`,
    );
    Logger.info(`saved ${output}`);
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
