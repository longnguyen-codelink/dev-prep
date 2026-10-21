import { loadEnv, type Plugin } from "vite";

import { ENV_CONFIG_PATH, RUNTIME_ENV_KEYS } from "../src/constants/index.ts";

// JSON in a <script> can still end the element or break the parser; these escapes keep the value inert.
const escapeForScript = (json: string): string =>
  json
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

export function buildEnvConfigScript(env: Record<string, string | undefined>): string {
  const kept: Record<string, string> = {};
  for (const key of RUNTIME_ENV_KEYS) {
    const value = env[key]?.trim();
    if (value) kept[key] = value;
  }
  return `window.__ENV__ = ${escapeForScript(JSON.stringify(kept))};\n`;
}

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
