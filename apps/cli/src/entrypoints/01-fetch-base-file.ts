import { createHash } from "node:crypto";
import { createWriteStream, existsSync } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { Writable } from "node:stream";
import { DATA_DIR, VIETNAM_OSM_PBF_NAME, VIETNAM_OSM_PBF_URL } from "../helpers/constants.ts";
import { Logger } from "../helpers/logger.ts";
import { tryCatch } from "../helpers/utils.ts";

export async function run() {
  if (existsSync(resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME))) {
    Logger.warn(`File already exists at ${resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME)}`);
    return;
  }

  const { data: filePath, error } = await tryCatch(download());

  if (error) {
    Logger.error(`Failed to download file: ${(error as Error).message}`);
    process.exit(1);
  }

  Logger.info(`Downloaded file to ${filePath}`);
}

async function fetchExpectedMd5(): Promise<string> {
  const res = await fetch(`${VIETNAM_OSM_PBF_URL}.md5`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for the md5 file`);
  return (await res.text()).trim().split(/\s+/)[0]!;
}

async function download(): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const dest = resolve(DATA_DIR, VIETNAM_OSM_PBF_NAME);
  const part = `${dest}.part`;

  const [response, expectedMd5] = await Promise.all([fetch(VIETNAM_OSM_PBF_URL), fetchExpectedMd5()]);

  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} for ${VIETNAM_OSM_PBF_URL}`);

  const total = Number(response.headers.get("content-length") ?? 0);
  const hash = createHash("md5");
  let loaded = 0;
  let lastBucket = -1;

  // The middle stage: look at each chunk (hash it, count it), then pass it on unchanged.
  const measure = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      hash.update(chunk);
      loaded += chunk.length;

      const bucket = total ? Math.floor((loaded / total) * 20) : -1; // every 5%
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        if (bucket >= 0) Logger.info(`Progress: ${bucket * 5}%`);
      }

      controller.enqueue(chunk); // same job as `yield chunk` in the Node version
    },
  });

  // The file sink: a Node write stream wrapped as a web WritableStream.
  const file = Writable.toWeb(createWriteStream(part)) as WritableStream<Uint8Array>;
  const { error: pipeError } = await tryCatch(response.body.pipeThrough(measure).pipeTo(file));
  if (pipeError) {
    await rm(part, { force: true }); // don't leave a half-written file behind
    throw pipeError;
  }

  const actual = hash.digest("hex");
  if (actual !== expectedMd5) {
    await rm(part, { force: true });
    throw new Error(`md5 mismatch: expected ${expectedMd5}, got ${actual}`);
  }

  await rename(part, dest); // the final name appears only after the checksum matches
  return dest;
}

if (import.meta.main) {
  run().catch((error) => {
    Logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  });
}
