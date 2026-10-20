import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

export type TileInfo = { z: number; x: number; y: number; path: string; bytes: number };

/** Lists every `{z}/{x}/{y}.pbf` under a tile folder with its size on disk. */
export async function listTiles(dir: string): Promise<TileInfo[]> {
  const tiles: TileInfo[] = [];
  for (const z of await readdir(dir)) {
    if (!/^\d+$/.test(z)) continue; // skips metadata.json
    for (const x of await readdir(join(dir, z))) {
      const files = (await readdir(join(dir, z, x))).filter((file) => file.endsWith(".pbf"));
      const infos = await Promise.all(
        files.map(async (file) => {
          const path = join(dir, z, x, file);
          return { z: Number(z), x: Number(x), y: Number(file.slice(0, -4)), path, bytes: (await stat(path)).size };
        }),
      );
      tiles.push(...infos);
    }
  }
  return tiles;
}

/** Size a host that gzips on the fly would send for this tile. */
export async function gzippedTileBytes(path: string): Promise<number> {
  return gzipSync(await readFile(path)).length;
}

export type SizedTile = TileInfo & { gzipBytes: number };

/** Adds the gzipped size to every tile, a few hundred at a time. */
export async function withGzipSizes(tiles: TileInfo[]): Promise<SizedTile[]> {
  const sized: SizedTile[] = [];
  for (let start = 0; start < tiles.length; start += 200) {
    const batch = tiles.slice(start, start + 200);
    sized.push(...(await Promise.all(batch.map(async (tile) => ({ ...tile, gzipBytes: await gzippedTileBytes(tile.path) })))));
  }
  return sized;
}
