import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { Plugin } from "vite";

import { BENCHMARK_SAVE_ENDPOINT } from "../src/constants/index.ts";

// Where the dev server appends every finished benchmark run (gitignored, under the repo's tmp folder).
const RUNS_FILE = resolve(import.meta.dirname, "../../../tmp/benchmark/runs.json");

// Appends to a JSON array one request at a time, so two runs finishing together cannot overwrite each other.
let queue: Promise<void> = Promise.resolve();

async function appendRun(run: unknown): Promise<void> {
  let runs: unknown[] = [];
  try {
    const parsed: unknown = JSON.parse(await readFile(RUNS_FILE, "utf8"));
    if (Array.isArray(parsed)) runs = parsed;
  } catch (error) {
    // A missing file starts a new log; any other failure (e.g. a corrupt file) must not be overwritten silently.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  runs.push({ savedAt: new Date().toISOString(), ...(run as object) });
  await mkdir(dirname(RUNS_FILE), { recursive: true });
  const tmp = `${RUNS_FILE}.part`;
  await writeFile(tmp, `${JSON.stringify(runs, null, 2)}\n`);
  await rename(tmp, RUNS_FILE);
}

export function benchmarkRuns(): Plugin {
  return {
    name: "benchmark-runs",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(BENCHMARK_SAVE_ENDPOINT, (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          queue = queue
            .then(async () => {
              const run: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
              if (typeof run !== "object" || run === null || !("id" in run) || !("mode" in run)) {
                res.statusCode = 400;
                res.end("not a benchmark run");
                return;
              }
              await appendRun(run);
              res.statusCode = 204;
              res.end();
            })
            .catch((error: Error) => {
              server.config.logger.error(`[benchmark-runs] ${error.message}`);
              res.statusCode = 500;
              res.end(error.message);
            });
        });
      });
    },
  };
}
