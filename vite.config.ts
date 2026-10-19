import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig, lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  fmt: {
    sortTailwindcss: {
      stylesheet: "./src/styles/global.css",
      functions: ["cn", "cva"],
    },
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  plugins: lazyPlugins(() => [vue(), tailwindcss()]),
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
