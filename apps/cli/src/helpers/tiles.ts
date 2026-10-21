import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { mkdir, rm, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { parseArgs } from "node:util";
import {
  DATA_DIR,
  DEFAULT_HIGHWAY_MIN_ZOOM,
  FEATURE_LINE_PREFIX,
  HIGHWAY_MIN_ZOOM,
  ROADS_GEOJSON_NAME,
  TILE_ATTRIBUTES,
  TILE_LAYER_NAME,
  TILE_MAX_ZOOM,
  TILE_MIN_ZOOM,
  TILES_DIR,
} from "./constants.ts";
import { Logger } from "./logger.ts";
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

/** Where tippecanoe writes: a folder of plain .pbf files, or one PMTiles archive. */
export type TileOutput = { kind: "folder"; path: string } | { kind: "pmtiles"; path: string };

export function tippecanoeArgs(input: string, output: TileOutput, settings: TileSettings): string[] {
  const args =
    output.kind === "folder"
      ? [
          `--output-to-directory=${output.path}`,
          "--no-tile-compression", // plain .pbf files work on any static host
        ]
      : ["-o", output.path]; // PMTiles compresses each tile by default, the smaller form
  args.push(
    `--layer=${TILE_LAYER_NAME}`,
    `--minimum-zoom=${settings.minZoom}`,
    `--maximum-zoom=${settings.maxZoom}`,
    "--read-parallel", // the prepared file has one feature per line
  );
  if (settings.fullDetail !== null) args.push(`--full-detail=${settings.fullDetail}`);
  if (settings.simplification !== null) args.push(`--simplification=${settings.simplification}`);
  if (settings.dropDensest) args.push("--drop-densest-as-needed", "--extend-zooms-if-still-dropping");
  args.push(input);
  return args;
}

type PreparedRun = { features: number; prepareMs: number; tippecanoeMs: number };

/**
 * The part shared by the folder and the archive: removes the old output, prepares the features, and runs
 * tippecanoe into `output`. Both builds therefore get exactly the same tiles.
 */
async function prepareAndTile(input: string, name: string, settings: TileSettings, output: TileOutput): Promise<PreparedRun> {
  const prepared = resolve(DATA_DIR, `${name}.prepared.geojsonl`);
  await mkdir(TILES_DIR, { recursive: true });
  await rm(output.path, { recursive: true, force: true });

  const prepareStarted = performance.now();
  const { features } = await prepareFeatures(input, prepared, settings);
  const prepareMs = Math.round(performance.now() - prepareStarted);

  const run = await runTool("tippecanoe", tippecanoeArgs(prepared, output, settings), { label: `tippecanoe ${name}` });
  return { features, prepareMs, tippecanoeMs: run.ms };
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
  const { features, prepareMs, tippecanoeMs } = await prepareAndTile(input, name, settings, { kind: "folder", path: dir });

  const tiles = await listTiles(dir);
  if (tiles.length === 0) throw new Error(`tippecanoe produced no tiles in ${dir}`);
  return {
    name,
    dir,
    features,
    prepareMs,
    tippecanoeMs,
    tiles: tiles.length,
    totalBytes: tiles.reduce((sum, tile) => sum + tile.bytes, 0),
    largestBytes: Math.max(...tiles.map((tile) => tile.bytes)),
  };
}

export type PmtilesResult = PreparedRun & { name: string; file: string; bytes: number };

/** Same preparation and tippecanoe settings as `buildTiles`, written as one PMTiles archive `tiles/<name>.pmtiles`. */
export async function buildPmtiles(input: string, name: string, settings: TileSettings): Promise<PmtilesResult> {
  const file = resolve(TILES_DIR, `${name}.pmtiles`);
  const run = await prepareAndTile(input, name, settings, { kind: "pmtiles", path: file });

  if (!existsSync(file)) throw new Error(`tippecanoe produced no archive at ${file}`);
  return { ...run, name, file, bytes: (await stat(file)).size };
}

export type TileBuildArgs = { name: string; input: string; settings: TileSettings };

function numberOption(value: string | undefined, fallback: number | null, flag: string, usage: string): number | null {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    Logger.error(`${flag} must be a number, got "${value}". ${usage}`);
    process.exit(1);
  }
  return parsed;
}

/** Parses the options shared by `build tiles` and `build pmtiles`; prints the usage and exits on a bad value. */
export function parseTileBuildArgs(args: string[], usage: string): TileBuildArgs {
  const { values } = parseArgs({
    args,
    options: {
      name: { type: "string" },
      input: { type: "string" },
      "min-zoom": { type: "string" },
      "max-zoom": { type: "string" },
      "full-detail": { type: "string" },
      simplification: { type: "string" },
      "no-drop": { type: "boolean" },
      "no-class-zoom": { type: "boolean" },
      "all-attributes": { type: "boolean" },
    },
  });

  if (!values.name) {
    Logger.error(usage);
    process.exit(1);
  }

  if (!/^[a-z0-9][a-z0-9-]*$/.test(values.name)) {
    Logger.error(`--name may only use lowercase letters, digits and dashes, got "${values.name}"`);
    process.exit(1);
  }

  const settings: TileSettings = {
    ...DEFAULT_TILE_SETTINGS,
    keepAttributes: values["all-attributes"] ? null : DEFAULT_TILE_SETTINGS.keepAttributes,
    minZoomByClass: !values["no-class-zoom"],
    minZoom: numberOption(values["min-zoom"], DEFAULT_TILE_SETTINGS.minZoom, "--min-zoom", usage)!,
    maxZoom: numberOption(values["max-zoom"], DEFAULT_TILE_SETTINGS.maxZoom, "--max-zoom", usage)!,
    fullDetail: numberOption(values["full-detail"], null, "--full-detail", usage),
    simplification: numberOption(values.simplification, null, "--simplification", usage),
    dropDensest: !values["no-drop"],
  };
  const input = resolve(values.input ?? resolve(DATA_DIR, ROADS_GEOJSON_NAME));

  return { name: values.name, input, settings };
}
