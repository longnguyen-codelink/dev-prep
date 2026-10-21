import { RUNTIME_ENV_KEYS } from "../src/constants/index.ts";

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
