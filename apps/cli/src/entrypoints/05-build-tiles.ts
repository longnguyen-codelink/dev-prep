import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { TILES_DIR, TILES_USAGE, WEB_TILES_DIR } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools } from "../helpers/shell-tools.ts";
import { buildTiles, parseTileBuildArgs } from "../helpers/tiles.ts";
import { formatDuration, tryCatch } from "../helpers/utils.ts";

export async function run(args: string[] = process.argv.slice(2)) {
  const { name, input, wards, settings } = parseTileBuildArgs(args, TILES_USAGE);

  const { data, error } = await tryCatch<Awaited<ReturnType<typeof buildTiles>>, Error>(
    (async () => {
      if (!existsSync(input)) throw new Error(`input not found: ${input} (build it with \`pnpm cli build roads\`)`);
      if (wards && !existsSync(wards)) throw new Error(`wards not found: ${wards} (build it with \`pnpm cli extract wards\`, or pass --no-wards)`);
      await assertTools();
      // Only the combined tiles are published; a roads-only build goes to an experiment folder, like `sweep tiles`.
      return buildTiles(input, name, settings, wards ? WEB_TILES_DIR : resolve(TILES_DIR, name), wards ?? undefined);
    })(),
  );
  if (error) {
    Logger.error(`Failed to build the tiles: ${error.message}`);
    process.exit(1);
  }

  Logger.info(`${data.name}: ${data.features} road features${data.wards > 0 ? ` + ${data.wards} wards` : ""} -> ${data.tiles} tiles in ${data.dir}`);
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
