import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins } from "vite-plus";

import { benchmarkRuns } from "./vite-plugins/benchmark-runs.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [vue(), tailwindcss(), benchmarkRuns()]),
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
