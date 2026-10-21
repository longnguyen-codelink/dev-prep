import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { CHECK_TILES_USAGE, INITIAL_VIEW, INITIAL_VIEW_BUDGET_BYTES, MAX_TILE_GZIP_BYTES, TILES_DIR, WEB_TILES_DIR } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { listTiles, withGzipSizes, type SizedTile } from "../helpers/tile-folder.ts";
import { tilesCoveringView, type View } from "../helpers/tile-math.ts";
import { tryCatch } from "../helpers/utils.ts";

function parseView(text: string | undefined): View {
  if (text === undefined) return INITIAL_VIEW;
  const parts = text.split(",").map(Number);
  if (parts.length !== 5 || parts.some((part) => !Number.isFinite(part))) {
    Logger.error(`--view must be lng,lat,zoom,width,height, got "${text}". ${CHECK_TILES_USAGE}`);
    process.exit(1);
  }
  const [lng, lat, zoom, width, height] = parts as [number, number, number, number, number];
  return { center: [lng, lat], zoom, width, height };
}

// Fails (exit 1) if any gzipped tile is over the limit, or the initial view is over its budget.
export async function run(args: string[] = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: { name: { type: "string" }, limit: { type: "string" }, view: { type: "string" } },
  });

  const limit = values.limit === undefined ? MAX_TILE_GZIP_BYTES : Number(values.limit);
  if (!Number.isFinite(limit) || limit <= 0) {
    Logger.error(`--limit must be a positive number of bytes, got "${values.limit}"`);
    process.exit(1);
  }

  const view = parseView(values.view);
  // Without --name, check the published tiles; with it, an experiment folder from `sweep tiles`.
  const dir = values.name ? resolve(TILES_DIR, values.name) : WEB_TILES_DIR;
  const { data: ok, error } = await tryCatch<boolean, Error>(checkTiles(dir, limit, view));
  if (error) {
    Logger.error(`Failed to check the tiles: ${error.message}`);
    process.exit(1);
  }
  process.exit(ok ? 0 : 1);
}

function describe(tile: SizedTile): string {
  return `${tile.z}/${tile.x}/${tile.y}: ${tile.gzipBytes} bytes gzipped (${tile.bytes} raw)`;
}

async function checkTiles(dir: string, limit: number, view: View): Promise<boolean> {
  if (!existsSync(dir)) throw new Error(`tile folder not found: ${dir} (build it with \`pnpm cli build tiles\`)`);
  const tiles = await withGzipSizes(await listTiles(dir));
  if (tiles.length === 0) throw new Error(`no tiles in ${dir}`);

  const totalRaw = tiles.reduce((sum, tile) => sum + tile.bytes, 0);
  const totalGzip = tiles.reduce((sum, tile) => sum + tile.gzipBytes, 0);
  Logger.info(`${tiles.length} tiles, ${totalRaw} bytes raw, ${totalGzip} bytes gzipped`);

  Logger.info("per zoom: tiles, total gzipped, largest gzipped");
  for (const z of [...new Set(tiles.map((tile) => tile.z))].sort((a, b) => a - b)) {
    const atZoom = tiles.filter((tile) => tile.z === z);
    const total = atZoom.reduce((sum, tile) => sum + tile.gzipBytes, 0);
    const largest = Math.max(...atZoom.map((tile) => tile.gzipBytes));
    Logger.info(`  z${z}: ${atZoom.length} tiles, ${total} bytes, largest ${largest} bytes`);
  }

  const largest = [...tiles].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 5);
  Logger.info("largest tiles:");
  for (const tile of largest) Logger.info(`  ${describe(tile)}`);

  let ok = true;
  const tooBig = tiles.filter((tile) => tile.gzipBytes > limit);
  if (tooBig.length <= 0) Logger.info(`OK: no tiles exceed the ${limit} byte limit`);
  else {
    ok = false;
    Logger.error(`${tooBig.length} tiles are over the ${limit} byte limit (gzipped):`);
    for (const tile of tooBig.slice(0, 10)) Logger.error(`  ${describe(tile)}`);
  }

  // Tiles the initial view would request; a tile missing from the folder is empty and costs nothing.
  const byKey = new Map(tiles.map((tile) => [`${tile.z}/${tile.x}/${tile.y}`, tile]));
  const wanted = tilesCoveringView(view);
  const present = wanted.map((tile) => byKey.get(`${tile.z}/${tile.x}/${tile.y}`)).filter((tile) => tile !== undefined);
  const viewBytes = present.reduce((sum, tile) => sum + tile.gzipBytes, 0);
  Logger.info(
    `initial view (center ${view.center.join(", ")}, zoom ${view.zoom}, ${view.width}x${view.height}): 
      ${wanted.length} tiles requested, ${present.length} exist, ${viewBytes} bytes gzipped`,
  );

  if (viewBytes <= INITIAL_VIEW_BUDGET_BYTES) Logger.info(`OK: the initial view is within ${INITIAL_VIEW_BUDGET_BYTES} bytes`);
  else {
    ok = false;
    Logger.error(`the initial view is over the ${INITIAL_VIEW_BUDGET_BYTES} byte budget`);
  }

  return ok;
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
