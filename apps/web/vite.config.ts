import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins } from "vite-plus";

import { benchmarkRuns } from "./vite-plugins/benchmark-runs.ts";
import { envConfig } from "./vite-plugins/env-config.ts";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: lazyPlugins(() => [vue(), tailwindcss(), benchmarkRuns(), envConfig()]),
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
