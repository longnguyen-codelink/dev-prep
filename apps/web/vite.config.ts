import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins } from "vite-plus";

import { benchmarkRuns, emitMaplibreWorker, injectRuntimeEnv } from "./plugins/index.ts";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: lazyPlugins(() => [vue(), tailwindcss(), benchmarkRuns(), emitMaplibreWorker(), injectRuntimeEnv()]),
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
