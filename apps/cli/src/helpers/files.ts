import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip } from "node:zlib";

/** Counts the lines of a file that start with `prefix`, reading it as a stream. */
export async function countLinesStartingWith(path: string, prefix: string): Promise<number> {
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  let count = 0;
  for await (const line of lines) {
    if (line.startsWith(prefix)) count++;
  }
  return count;
}

/** Size in bytes the file would have when gzipped, without keeping the compressed data. */
export async function gzippedSize(path: string): Promise<number> {
  let bytes = 0;
  const counter = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      callback();
    },
  });
  await pipeline(createReadStream(path), createGzip(), counter);
  return bytes;
}
