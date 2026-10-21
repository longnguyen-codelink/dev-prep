// Writes the runtime config (window.__ENV__) for a deploy. Run with Node 24 type stripping:
//   node apps/web/scripts/generate-env-config.ts [outputPath] [--require-map-host]

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";

import { ENV_CONFIG_OUTPUT_PATH, RUNTIME_ENV_KEYS } from "../src/constants/index.ts";
import { buildEnvConfigScript } from "../vite-plugins/build-env-config-script.ts";

// Accepts an https origin, optionally followed by a path prefix; trailing slashes are dropped.
// Throws with a message that names the rule, never the value, so a bad URL with a token cannot reach the log.
function normaliseMapHost(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("MAP_HOST must be an absolute https URL (an origin, optionally followed by a path prefix)");
  }
  if (url.protocol !== "https:") throw new Error("MAP_HOST must use https://");
  if (url.search || url.hash) throw new Error("MAP_HOST must not contain a query or hash");
  return (url.origin + url.pathname).replace(/\/+$/, "");
}

function checkBasemapStyleUrl(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("BASEMAP_STYLE_URL must be an absolute http(s) URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("BASEMAP_STYLE_URL must use http(s)://");
}

function main(): void {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { "require-map-host": { type: "boolean", default: false } },
  });
  if (positionals.length > 1) throw new Error("expected at most one output path");

  const env: Record<string, string | undefined> = {};

  const mapHost = process.env.MAP_HOST?.trim();
  if (mapHost) env.MAP_HOST = normaliseMapHost(mapHost);
  else if (values["require-map-host"]) throw new Error("MAP_HOST is not set (required by --require-map-host)");

  const basemapStyleUrl = process.env.BASEMAP_STYLE_URL?.trim();
  if (basemapStyleUrl) {
    checkBasemapStyleUrl(basemapStyleUrl);
    env.BASEMAP_STYLE_URL = basemapStyleUrl;
  }

  // Everything is validated before the first write, so a failure leaves the output untouched.
  const output = resolve(process.cwd(), positionals[0] ?? ENV_CONFIG_OUTPUT_PATH);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, buildEnvConfigScript(env));

  const written = RUNTIME_ENV_KEYS.filter((key) => env[key] !== undefined);
  const origin = env.MAP_HOST ? ` (MAP_HOST ${env.MAP_HOST})` : "";
  console.log(`Wrote ${output} with ${written.length ? written.join(", ") : "no keys (defaults)"}${origin}`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`generate-env-config: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
