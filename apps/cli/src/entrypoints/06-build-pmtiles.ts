import { existsSync } from "node:fs";
import { BUILD_PMTILES_USAGE } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { assertTools } from "../helpers/shell-tools.ts";
import { buildPmtiles, parseTileBuildArgs } from "../helpers/tiles.ts";
import { formatBytes, formatDuration, tryCatch } from "../helpers/utils.ts";

// Same stage as `build tiles`, but one PMTiles archive instead of a folder of .pbf files.
export async function run(args: string[] = process.argv.slice(2)) {
  const { name, input, settings } = parseTileBuildArgs(args, BUILD_PMTILES_USAGE);

  const { data, error } = await tryCatch<Awaited<ReturnType<typeof buildPmtiles>>, Error>(
    (async () => {
      if (!existsSync(input)) throw new Error(`input not found: ${input} (build it with \`pnpm cli build roads\`)`);
      await assertTools();
      return buildPmtiles(input, name, settings);
    })(),
  );
  if (error) {
    Logger.error(`Failed to build the PMTiles archive: ${error.message}`);
    process.exit(1);
  }

  Logger.info(`${data.name}: ${data.features} features -> ${data.file}`);
  Logger.info(
    `archive ${formatBytes(data.bytes)} (${data.bytes} bytes); ` +
      `build ${formatDuration(data.prepareMs + data.tippecanoeMs)} ` +
      `(prepare ${formatDuration(data.prepareMs)}, tippecanoe ${formatDuration(data.tippecanoeMs)})`,
  );
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
