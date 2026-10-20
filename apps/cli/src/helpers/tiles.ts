import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  DATA_DIR,
  DEFAULT_HIGHWAY_MIN_ZOOM,
  FEATURE_LINE_PREFIX,
  HIGHWAY_MIN_ZOOM,
  TILE_ATTRIBUTES,
  TILE_LAYER_NAME,
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
  TILES_DIR,
} from "./constants.ts";
import { runTool } from "./shell-tools.ts";
import { listTiles } from "./tile-folder.ts";

export type TileSettings = {
  keepAttributes: readonly string[] | null; // null keeps every attribute
  minZoomByClass: boolean; // road classes appear from different zooms
  minZoom: number;
  maxZoom: number;
  fullDetail: number | null; // tippecanoe --full-detail (tile coordinate precision at the max zoom)
  simplification: number | null; // tippecanoe --simplification
  dropDensest: boolean; // --drop-densest-as-needed and --extend-zooms-if-still-dropping
};

export const DEFAULT_TILE_SETTINGS: TileSettings = {
  keepAttributes: TILE_ATTRIBUTES,
  minZoomByClass: true,
  minZoom: TILE_MIN_ZOOM,
  maxZoom: TILE_MAX_ZOOM,
  fullDetail: null,
  simplification: null,
  dropDensest: true,
};

type Feature = { type: "Feature"; properties: Record<string, unknown>; geometry: unknown; tippecanoe?: { minzoom: number } };

/** Zoom from which a road of this `highway` class is drawn. */
export function minZoomFor(highway: unknown): number {
  if (typeof highway !== "string") return DEFAULT_HIGHWAY_MIN_ZOOM;
  const parent = highway.endsWith("_link") ? highway.slice(0, -"_link".length) : highway;
  return HIGHWAY_MIN_ZOOM[parent] ?? DEFAULT_HIGHWAY_MIN_ZOOM;
}

export type PrepareResult = { features: number; perClass: Record<string, number> };

/**
 * Streams the roads GeoJSON (one feature per line) into newline-delimited GeoJSON for tippecanoe,
 * keeping only the wanted attributes and adding each road class's minimum zoom.
 */
export async function prepareFeatures(input: string, output: string, settings: TileSettings): Promise<PrepareResult> {
  const result: PrepareResult = { features: 0, perClass: {} };

  async function* prepared(): AsyncGenerator<string> {
    const lines = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
    for await (const line of lines) {
      if (!line.startsWith(FEATURE_LINE_PREFIX)) continue;
      const feature = JSON.parse(line.endsWith(",") ? line.slice(0, -1) : line) as Feature;

      const highway = feature.properties.highway;
      const key = typeof highway === "string" ? highway : "(none)";
      result.features++;
      result.perClass[key] = (result.perClass[key] ?? 0) + 1;

      if (settings.keepAttributes) {
        const kept: Record<string, unknown> = {};
        for (const name of settings.keepAttributes) {
          if (feature.properties[name] != null) kept[name] = feature.properties[name];
        }
        feature.properties = kept;
      }
      if (settings.minZoomByClass) feature.tippecanoe = { minzoom: minZoomFor(highway) };

      yield `${JSON.stringify(feature)}\n`;
    }
  }

  await pipeline(Readable.from(prepared()), createWriteStream(output));
  return result;
}

export function tippecanoeArgs(input: string, outDir: string, settings: TileSettings): string[] {
  const args = [
    `--output-to-directory=${outDir}`,
    "--no-tile-compression", // plain .pbf files work on any static host
    `--layer=${TILE_LAYER_NAME}`,
    `--minimum-zoom=${settings.minZoom}`,
    `--maximum-zoom=${settings.maxZoom}`,
    "--read-parallel", // the prepared file has one feature per line
  ];
  if (settings.fullDetail !== null) args.push(`--full-detail=${settings.fullDetail}`);
  if (settings.simplification !== null) args.push(`--simplification=${settings.simplification}`);
  if (settings.dropDensest) args.push("--drop-densest-as-needed", "--extend-zooms-if-still-dropping");
  args.push(input);
  return args;
}

export type BuildResult = {
  name: string;
  dir: string;
  features: number;
  prepareMs: number;
  tippecanoeMs: number;
  tiles: number;
  totalBytes: number;
  largestBytes: number;
};

/** Prepares the features, runs tippecanoe into `tiles/<name>/`, and measures the folder. */
export async function buildTiles(input: string, name: string, settings: TileSettings): Promise<BuildResult> {
  const dir = resolve(TILES_DIR, name);
  const prepared = resolve(DATA_DIR, `${name}.prepared.geojsonl`);
  await mkdir(TILES_DIR, { recursive: true });
  await rm(dir, { recursive: true, force: true });

  const prepareStarted = performance.now();
  const { features } = await prepareFeatures(input, prepared, settings);
  const prepareMs = Math.round(performance.now() - prepareStarted);

  const run = await runTool("tippecanoe", tippecanoeArgs(prepared, dir, settings), { label: `tippecanoe ${name}` });

  const tiles = await listTiles(dir);
  if (tiles.length === 0) throw new Error(`tippecanoe produced no tiles in ${dir}`);
  return {
    name,
    dir,
    features,
    prepareMs,
    tippecanoeMs: run.ms,
    tiles: tiles.length,
    totalBytes: tiles.reduce((sum, tile) => sum + tile.bytes, 0),
    largestBytes: Math.max(...tiles.map((tile) => tile.bytes)),
  };
}
