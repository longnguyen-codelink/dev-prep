import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  DATA_DIR,
  INITIAL_VIEW,
  MAX_TILE_GZIP_BYTES,
  ROADS_GEOJSON_NAME,
  SWEEP_BASE,
  SWEEP_USAGE,
  SWEEP_VARIANTS,
  TILES_DIR,
} from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools } from "../helpers/shell-tools.ts";
import { listTiles, withGzipSizes } from "../helpers/tile-folder.ts";
import { tilesCoveringView } from "../helpers/tile-math.ts";
import { buildTiles, type TileSettings } from "../helpers/tiles.ts";
import { formatBytes, formatDuration, tryCatch } from "../helpers/utils.ts";

type Row = { name: string; change: string; cells: string[] };

// Rebuilds the tiles once per variant, measures each build, and writes a markdown table.
export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({ args, options: { input: { type: "string" }, only: { type: "string" }, keep: { type: "boolean" } } });

  const input = resolve(values.input ?? resolve(DATA_DIR, ROADS_GEOJSON_NAME));
  const only = values.only?.split(",");
  const unknown = only?.filter((name) => !SWEEP_VARIANTS.some((variant) => variant.name === name)) ?? [];
  if (unknown.length > 0) {
    Logger.error(`unknown variant(s): ${unknown.join(", ")}. ${SWEEP_USAGE}`);
    process.exit(1);
  }

  if (!existsSync(input)) {
    Logger.error(`input not found: ${input} (build it with 03-build-roads.ts)`);
    process.exit(1);
  }

  await assertTools();

  const rows: Row[] = [];
  for (const variant of SWEEP_VARIANTS.filter((v) => !only || only.includes(v.name))) {
    const name = `sweep-${variant.name}`;
    Logger.info(`--- ${variant.name}: ${variant.change} ---`);

    const { data, error } = await tryCatch<Row["cells"], Error>(measureVariant(input, name, variant.settings));
    rows.push({ name: variant.name, change: variant.change, cells: error ? failedCells(error) : data });
    if (!values.keep) await rm(resolve(TILES_DIR, name), { recursive: true, force: true });
  }

  const table = [
    "| Variant | Change | Build time | Tiles | Raw size | Gzipped size | Largest tile (gz) | Tiles over 500 KB | Initial view (gz) |",
    "|---|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.name} | ${row.change} | ${row.cells.join(" | ")} |`),
  ].join("\n");
  const out = resolve(TILES_DIR, "sweep.md");
  await writeFile(out, `${table}\n`);
  Logger.info(`wrote ${out}`);
  console.log(`\n${table}\n`);
}

function failedCells(error: Error): string[] {
  const reason = error.message.split("\n").slice(-1)[0]!.replace(/\|/g, "/").slice(0, 90);
  return [`failed: ${reason}`, "-", "-", "-", "-", "-", "-"];
}

async function measureVariant(input: string, name: string, change: Partial<TileSettings>) {
  const built = await buildTiles(input, name, { ...SWEEP_BASE, ...change });
  const tiles = await withGzipSizes(await listTiles(built.dir));

  const gzip = tiles.reduce((sum, tile) => sum + tile.gzipBytes, 0);
  const largest = Math.max(...tiles.map((tile) => tile.gzipBytes));
  const over = tiles.filter((tile) => tile.gzipBytes > MAX_TILE_GZIP_BYTES).length;

  const byKey = new Map(tiles.map((tile) => [`${tile.z}/${tile.x}/${tile.y}`, tile]));
  const viewBytes = tilesCoveringView(INITIAL_VIEW)
    .map((tile) => byKey.get(`${tile.z}/${tile.x}/${tile.y}`)?.gzipBytes ?? 0)
    .reduce((sum, bytes) => sum + bytes, 0);

  return [
    formatDuration(built.prepareMs + built.tippecanoeMs),
    String(built.tiles),
    formatBytes(built.totalBytes),
    formatBytes(gzip),
    formatBytes(largest),
    String(over),
    formatBytes(viewBytes),
  ];
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
