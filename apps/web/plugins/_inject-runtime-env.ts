import type { Plugin } from "vite";

import { loadEnv } from "vite-plus";

export function injectRuntimeEnv(): Plugin {
  return {
    name: "inject-runtime-env",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/env-config.js", (_req, res) => {
        const env = loadEnv(server.config.mode, server.config.envDir, "");
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store");
        res.end(
          `window.__ENV__ = ${JSON.stringify({ MAP_HOST: env.MAP_HOST, BUILD_COMMIT: env.BUILD_COMMIT, BUILD_REPO_URL: env.BUILD_REPO_URL })};\n`,
        );
      });
    },
  };
}
