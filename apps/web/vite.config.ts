import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { defineConfig, lazyPlugins, loadEnv } from "vite-plus";

import { benchmarkRuns } from "./vite-plugins/benchmark-runs.ts";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: lazyPlugins(() => [
    vue(),
    tailwindcss(),
    benchmarkRuns(),
    {
      // MapLibre 6 loads maplibre-gl-worker.mjs as a sibling of the script holding it; the bundle drops it, so ship it.
      // Emitted as .js because the host serves .mjs as application/octet-stream, which browsers reject for module workers.
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
    },
    {
      // Dev only: answers /env-config.js from the environment (or .env files); in production CI writes it.
      name: "inject-runtime-env",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/env-config.js", (_req, res) => {
          const env = loadEnv(server.config.mode, server.config.envDir, "");
          res.setHeader("Content-Type", "application/javascript");
          res.setHeader("Cache-Control", "no-store");
          res.end(`window.__ENV__ = ${JSON.stringify({ MAP_HOST: env.MAP_HOST })};\n`);
        });
      },
    },
  ]),
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  optimizeDeps: {
    exclude: ["maplibre-gl"],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
