import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Writable } from "node:stream";
import { Logger } from "./helpers/logger.ts";

const NAME = "vietnam-260101.osm.pbf";
const PBF_URL = `https://download.geofabrik.de/asia/${NAME}`;
const DATA_DIR = resolve(import.meta.dirname, "../../../tmp/data");

main().catch((error) => {
  Logger.error(`Unexpected error: ${(error as Error).message}`);
  process.exit(1);
});

async function main() {
  if (existsSync(resolve(DATA_DIR, NAME))) {
    Logger.warn(`File already exists at ${resolve(DATA_DIR, NAME)}`);
    return;
  }

  try {
    const filePath = await download();
    Logger.info(`Downloaded file to ${filePath}`);
  } catch (error) {
    Logger.error(`Failed to download file: ${(error as Error).message}`);
  }
}

async function fetchExpectedMd5(): Promise<string> {
  const res = await fetch(`${PBF_URL}.md5`);
  if (!res.ok) throw new Error(`HTTP ${res.status} for the md5 file`);
  return (await res.text()).trim().split(/\s+/)[0]!;
}

async function download(): Promise<string> {
  await mkdir(DATA_DIR, { recursive: true });
  const dest = resolve(DATA_DIR, NAME);
  const part = `${dest}.part`;

  const [response, expectedMd5] = await Promise.all([fetch(PBF_URL), fetchExpectedMd5()]);
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status} for ${PBF_URL}`);

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

  try {
    await response.body.pipeThrough(measure).pipeTo(file);
  } catch (error) {
    await rm(part, { force: true }); // don't leave a half-written file behind
    throw error;
  }

  const actual = hash.digest("hex");
  if (actual !== expectedMd5) {
    await rm(part, { force: true });
    throw new Error(`md5 mismatch: expected ${expectedMd5}, got ${actual}`);
  }

  await rename(part, dest); // the final name appears only after the checksum matches
  return dest;
}
