import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { DATA_DIR, ROADS_GEOJSON_NAME, TILES_USAGE } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools } from "../helpers/shell-tools.ts";
import { buildTiles, DEFAULT_TILE_SETTINGS, type TileSettings } from "../helpers/tiles.ts";
import { formatDuration, tryCatch } from "../helpers/utils.ts";

function numberOption(value: string | undefined, fallback: number | null, flag: string): number | null {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    Logger.error(`${flag} must be a number, got "${value}". ${TILES_USAGE}`);
    process.exit(1);
  }
  return parsed;
}

export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      name: { type: "string" },
      input: { type: "string" },
      "min-zoom": { type: "string" },
      "max-zoom": { type: "string" },
      "full-detail": { type: "string" },
      simplification: { type: "string" },
      "no-drop": { type: "boolean" },
      "no-class-zoom": { type: "boolean" },
      "all-attributes": { type: "boolean" },
    },
  });

  if (!values.name) {
    Logger.error(TILES_USAGE);
    process.exit(1);
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(values.name)) {
    Logger.error(`--name may only use lowercase letters, digits and dashes, got "${values.name}"`);
    process.exit(1);
  }

  const settings: TileSettings = {
    ...DEFAULT_TILE_SETTINGS,
    keepAttributes: values["all-attributes"] ? null : DEFAULT_TILE_SETTINGS.keepAttributes,
    minZoomByClass: !values["no-class-zoom"],
    minZoom: numberOption(values["min-zoom"], DEFAULT_TILE_SETTINGS.minZoom, "--min-zoom")!,
    maxZoom: numberOption(values["max-zoom"], DEFAULT_TILE_SETTINGS.maxZoom, "--max-zoom")!,
    fullDetail: numberOption(values["full-detail"], null, "--full-detail"),
    simplification: numberOption(values.simplification, null, "--simplification"),
    dropDensest: !values["no-drop"],
  };
  const input = resolve(values.input ?? resolve(DATA_DIR, ROADS_GEOJSON_NAME));

  const { data, error } = await tryCatch<Awaited<ReturnType<typeof buildTiles>>, Error>(
    (async () => {
      if (!existsSync(input)) throw new Error(`input not found: ${input} (build it with \`pnpm cli build roads\`)`);
      await assertTools();
      return buildTiles(input, values.name!, settings);
    })(),
  );
  if (error) {
    Logger.error(`Failed to build the tiles: ${error.message}`);
    process.exit(1);
  }

  Logger.info(`${data.name}: ${data.features} features -> ${data.tiles} tiles in ${data.dir}`);
  Logger.info(
    `total ${data.totalBytes} bytes, largest tile ${data.largestBytes} bytes (uncompressed); ` +
      `prepare ${formatDuration(data.prepareMs)}, tippecanoe ${formatDuration(data.tippecanoeMs)}`,
  );
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
