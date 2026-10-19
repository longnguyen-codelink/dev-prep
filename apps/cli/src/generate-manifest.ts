#!/usr/bin/env node
import { readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { WEB_MAP_DIR } from "./helpers/constants.ts";

/** Lists `*.geojson` files in `dir` and writes them to `manifest.json` in the same directory. */
async function main(dir = WEB_MAP_DIR) {
  const files = (await readdir(dir)).filter((file) => file.endsWith(".geojson")).toSorted();
  const out = join(dir, "manifest.json");
  await writeFile(out, `${JSON.stringify({ files }, null, 2)}\n`);
  console.log(`wrote ${out} (${files.length} files)`);
}

main(process.argv[2] ? resolve(process.argv[2]) : undefined).catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
