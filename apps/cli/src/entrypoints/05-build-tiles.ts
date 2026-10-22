import { existsSync } from "node:fs";
import { TILES_USAGE } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools } from "../helpers/shell-tools.ts";
import { buildTiles, parseTileBuildArgs } from "../helpers/tiles.ts";
import { formatDuration, tryCatch } from "../helpers/utils.ts";

export async function run(args: string[] = process.argv.slice(2)) {
  const { name, input, settings } = parseTileBuildArgs(args, TILES_USAGE);

  const { data, error } = await tryCatch<Awaited<ReturnType<typeof buildTiles>>, Error>(
    (async () => {
      if (!existsSync(input)) throw new Error(`input not found: ${input} (build it with \`pnpm cli build roads\`)`);
      await assertTools();
      return buildTiles(input, name, settings);
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
