import { loadEnv, type Plugin } from "vite";

import { ENV_CONFIG_PATH } from "../src/constants/index.ts";
import { buildEnvConfigScript } from "./build-env-config-script.ts";

export { buildEnvConfigScript };

// Reads the env on every request, so an edited .env file shows on the next reload without a dev server restart.
export function envConfig(): Plugin {
  return {
    name: "env-config",
    apply: "serve",
    configureServer(server) {
      // Middlewares added here run before Vite's base handling, so they see the URL with the base still on it.
      const path = server.config.base.replace(/\/$/, "") + ENV_CONFIG_PATH;
      server.middlewares.use(path, (req, res) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET, HEAD");
          res.end();
          return;
        }
        // The empty prefix also merges process.env; buildEnvConfigScript keeps only the known keys.
        const env = loadEnv(server.config.mode, server.config.envDir, "");
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(buildEnvConfigScript(env));
      });
    },
  };
}
