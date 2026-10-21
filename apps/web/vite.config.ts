import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
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
