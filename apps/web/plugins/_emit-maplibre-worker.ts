import type { Plugin } from "vite";

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

export function emitMaplibreWorker(): Plugin {
  return {
    name: "emit-maplibre-worker",
    apply: "build",
    generateBundle() {
      const dist = join(dirname(createRequire(import.meta.url).resolve("maplibre-gl/package.json")), "dist");
      this.emitFile({
        type: "asset",
        fileName: "assets/maplibre-gl-worker.js",
        source: readFileSync(join(dist, "maplibre-gl-worker.mjs")),
      });
    },
  };
}
