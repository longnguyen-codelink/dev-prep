# Ho Chi Minh City on a map: raw GeoJSON vs vector tiles vs PM Tiles

A two-week GIS learning project. It answers one question: **what does it cost a web page to show every road of Ho Chi Minh City (209,399 road segments) as one raw GeoJSON file, as a folder of vector tiles, or as a single PM Tiles archive?**

The data is OpenStreetMap, the tools are open source, and the app is a static Vue + MapLibre site with a built-in benchmark view.

**Live site:** <https://landing-stage.longngphuc.id.vn/dev-challenge-gis/> (add `?benchmark` for the benchmark view).

## Quick start

Everything runs in the dev container, because the GIS tools live there. On the host only the editor is needed.

Don't want the dev container? Set up the workspace by hand: see [Manual setup](#manual-setup-without-the-dev-container).

### 1. Dev container

Open the repo in VS Code and choose "Reopen in Container". The config is `.devcontainer/devcontainer.json`:

- Base image `ghcr.io/voidzero-dev/vite-plus:latest` (Node 24, `vp`, pnpm), remote user `vp`.
- Everything else is a pinned devcontainer Feature: `osmium-tool` and `gdal-bin` (apt), `jq`, `tippecanoe`, git and the Claude Code CLI.
- Ports 8080 and 5173 are forwarded. `.devcontainer/commands/setup.sh` creates an empty `.env` on the host if it is missing (the container reads it with `--env-file`).
- To run a command from a host terminal instead: `docker exec -u vp -w /workspaces/dev-prep <container> sh -lc '<command>'`.

Tool versions seen on this setup: osmium 1.15.0, GDAL 3.6.2, tippecanoe v2.82.0 (tippecanoe's Feature builds from its default branch, so a rebuilt container may get a newer version).

### 2. Install and start the app

```bash
vp install      # installs with the pnpm version pinned in devEngines (12.11.2)
vp dev          # Vite+ dev server at http://localhost:5173
```

The app needs the map data under `apps/web/public/map/` (gitignored). The CLI writes its published files (boundary, wards, roads GeoJSON, tile folder, PMTiles archive) straight there, with no symlinks: build them as described in [The data pipeline](#the-data-pipeline-appscli), or set `MAP_HOST` to a host that already has them.

### 3. URL parameters

| Parameter | Effect |
| --- | --- |
| `?mode=tiles` (default) / `?mode=geojson` | Which roads source loads. Anything other than `geojson` means tiles. |
| `?tileMode=folder` (default) / `?tileMode=pmtiles` | Tiles from the `{z}/{x}/{y}.pbf` folder, or from the PM Tiles archive. Only used in tiles mode. |
| `?layers=-roads,+wards` | Which layer groups are drawn, as the difference from the defaults (boundary and roads on, wards off): `-` switches a default group off, `+` switches wards on. Written by the toolbar's Layers select; ignored in the benchmark view. See [Layers and wards](#layers-and-wards). |
| `?benchmark` | Opens the benchmark view (fixed 1280 x 720 map box, pixel ratio pinned to 1, run panels). |
| `?benchmark&run` | That page load records one benchmark run, then `run` is dropped from the URL so a manual reload does not record again. The "Run" button reloads the page with it. |

Switching mode or tile mode in the toolbar reloads the page, so every run is a clean page load.

## Manual setup (without the dev container)

The dev container only bundles the tools below. You can install them yourself on macOS or Linux.

| Tool | Needed for | Notes |
| --- | --- | --- |
| Node 24 | web app and CLI | The CLI is TypeScript that Node 24 runs directly, so older Node will not work. |
| Vite+ (`vp`) | `vp install`, `vp dev`, `vp check` | Install it following the Vite+ docs. It pins and downloads pnpm 12.11.2 from `devEngines`. |
| `osmium` (osmium-tool) | `extract boundary`, `build roads` | |
| `ogr2ogr` (GDAL) | `extract boundary`, `build roads` | GDAL needs the OSM driver, which the usual packages include. |
| `tippecanoe` | `build tiles`, `build pmtiles`, `sweep tiles` | Version 2.x; `build pmtiles` needs a build that can write `.pmtiles`. |
| `jq` | optional | Only for inspecting data by hand. |

```bash
# macOS (Homebrew)
brew install osmium-tool gdal tippecanoe jq

# Debian / Ubuntu (tippecanoe is not in the default repos on every release; build it from https://github.com/felt/tippecanoe)
sudo apt-get install osmium-tool gdal-bin jq
```

Then, from the repo root:

```bash
vp install
vp dev
```

- **Web app only:** if you just want to run or work on the app, you do not need osmium, GDAL or tippecanoe. Set `MAP_HOST` (in the environment or in `.env`, see `.env.example`) to a host that already serves the map data, or build the data with the CLI, which writes into `apps/web/public/map/`.
- **Data pipeline:** all three GIS tools must be on your `PATH`. Every CLI command checks for them first and stops with an error naming any that are missing. With the default `simple` extract strategy the roads step needed about 47 MiB of memory on the full Vietnam extract; `complete_ways` was killed above about 3.3 GiB.
- The dev container creates an empty `.env` for you; without it, create one yourself only if you want to set `MAP_HOST`.

## Project structure

```text
apps/cli   data pipeline: OSM extract -> roads GeoJSON -> tiles (folder or PMTiles) -> checks
apps/web   Vue 3 + MapLibre GL JS app with a benchmark view
data       hosted separately on an external host, read by the app at runtime
```

- **`apps/cli`** is erasable TypeScript that Node 24 runs directly (no build step). It shells out to `osmium`, `ogr2ogr` and `tippecanoe`.
- **`apps/web`** is Vue 3, MapLibre GL JS 6, Tailwind 4 and shadcn-vue, built with Vite+ (`vp`). The `pmtiles` npm package lets MapLibre read the archive.
- **The map data is not in the repo and not in the deployed bundle.** It is generated locally by the CLI and uploaded by hand to a public bucket on an external host. The app finds it through `MAP_HOST` (below).
- **Deploy:** a manual GitHub Actions workflow (`.github/workflows/deploy.yml`, `workflow_dispatch`, only from `challenge/gis`) builds `apps/web` on a GitHub runner, writes `env-config.js` into `dist/`, then `rsync`s `dist/` to an external host over SSH. The site is served at `/dev-challenge-gis/`, so the build sets `VITE_BASE_PATH`.
- **Basemap:** OpenFreeMap "liberty" style. Only the roads overlay is under test.

### Runtime config: `MAP_HOST`

The data location is **not** a build-time variable. `index.html` loads `/env-config.js`, which sets `window.__ENV__ = { MAP_HOST }`, and `apps/web/src/constants/endpoints.ts` builds every data URL from it:

| Data | URL |
| --- | --- |
| Roads GeoJSON | `<MAP_HOST>/map/hcmc-roads.geojson` |
| Boundary GeoJSON | `<MAP_HOST>/map/hcmc-boundary.geojson` |
| Ward GeoJSON | `<MAP_HOST>/map/hcmc-wards.geojson` (only requested when Wards is switched on) |
| Tile folder | `<MAP_HOST>/map/tiles/{z}/{x}/{y}.pbf` |
| PMTiles archive | `<MAP_HOST>/map/hcmc-roads.pmtiles` |

- `MAP_HOST` is an origin, optionally followed by a path prefix (production: a path prefix on the external data host). Unset means same origin, which is the local `apps/web/public/map` folder.
- In development a Vite plugin answers `/env-config.js` from `MAP_HOST` in the environment or `.env` files (see `.env.example`). In CI the workflow overwrites `dist/env-config.js` from the `MAP_HOST` repository variable. One built bundle can therefore run against any data host.
- The values reach the browser, so they are **public**. No secrets belong in them.
- A data host on another origin must send **CORS** headers, **`Timing-Allow-Origin`** (otherwise cross-origin Resource Timing reports 0 bytes and the benchmark cannot count) and support HTTP **Range** requests (PM Tiles).

## Results at a glance

Initial view (zoom 12, centre of the city), map box 1280 x 720 at pixel ratio 1, deployed site, first pass of the latest batch: median of 4 runs per variant, recorded 2026-10-21 21:53 to 21:56 (UTC+7) in the Claude desktop app's built-in browser.

| | GeoJSON | Tiles (Folder) | Tiles (PM Tiles) |
| --- | --- | --- | --- |
| Ready (first data request until the map is idle) | 9.29 s | 0.88 s | 1.65 s |
| Bytes on the wire | 14.8 MB | 372 KB | 207 KB |
| Requests | 1 | 11 (+1 missing tile) | 13 range requests |

How to read this:

- **Folder is the fastest** (about 10.6x faster than GeoJSON). **PM Tiles reads the fewest bytes** but was 1.9x to 2.8x slower than Folder, and still about 5.6x faster than GeoJSON.
- **Bytes are the steadier headline.** Seconds depend on the network between the browser and the data host and moved between batches while the byte counts did not.
- The GeoJSON file is 80.5 MB raw. The data host serves it brotli-compressed, so 14.8 MB is what crossed the wire.
- The same tiles cost 372 KB as a folder and 207 KB as PM Tiles because the folder is built with `--no-tile-compression` (plain `.pbf`) and PMTiles gzips each tile by default. The 207 KB includes the header and directory reads.
- The throttled-network set (slow network, CPU slowdown) is still to be recorded.

Full method, per-run numbers and caveats are in [Benchmark](#benchmark).

## Layers and wards

The overlay is drawn in three layer groups. A **Layers** multiselect in the toolbar switches whole groups; the **Active layers** row under it lists each drawn layer with the colour the map paints it in.

| Group | Layers | Default |
| --- | --- | --- |
| Boundary | City boundary (outline and 10 % fill) | on |
| Wards | Ward fill, ward outline, ward names | off |
| Roads | Major, medium and minor roads (3 map layers in the tile modes, 6 in GeoJSON mode, which draws each class from its own zoom) | on |

- **Groups are found by metadata, not by layer id.** Every overlay layer carries `metadata: { group }` and `applyVisibility()` sets `visibility` on the layers of the enabled groups, so the tile and GeoJSON road layer ids never have to be listed. The badge labels, group, colours and minimum zooms are the `LAYER_ENTRIES` registry in `apps/web/src/constants/index.ts`; the map layers take their colours from it, so the badges cannot drift from the map.
- **A badge dims while the map is zoomed out below its layer's minimum zoom:** city boundary always; major roads from z8; medium roads z10; minor roads z13; ward fill and outline z10; ward names z12 (each value is inclusive: the layer is drawn at exactly that zoom).
- **The benchmark view is untouched:** no Layers select, `?layers` is ignored (the default groups are drawn) and the ward file is never requested, so request counts and bytes of the three variants stay at 1 / 80,498,401, 11 / 372,346 and 13 / 206,973.

### The ward layer

A ward is an OSM relation that is a `subarea` member of the city relation `1973756` with `admin_level=6`. In the pinned snapshot that gives **168 wards: 113 phường, 54 xã and 1 đặc khu (Côn Đảo)**, all with a `name`. Membership is used rather than "inside the city polygon" because the same bounding box holds 357 level-6 areas of neighbouring provinces (for example Phường Trấn Biên in Biên Hòa). Côn Đảo is an island group about 180 km south, so the ward file's extent is much larger than the city core. Level 6 is the commune level since the 2025 reform; in an older snapshot it meant districts, so `extract wards` fails if a member is not level 6 or has no name.

- **Data:** `pnpm cli extract wards` writes `apps/web/public/map/hcmc-wards.geojson` (939 KB, 234 KB gzipped, only `osm_id` and `name`). It reuses `tmp/data/vn-admin.osm.pbf` and takes about a second; the geometries are simplified per feature to about 5 m (`--simplify 0.00005`, 5 decimals), so a border shared by two wards can open a hairline gap that is invisible at map scale.
- **Drawing:** from z10 each ward gets a fill (one of the five chart colours picked by `osm_id % 5`, 20 % opacity; neighbours can share a tint) and a dashed dark outline; from z12 the Vietnamese name in the basemap's own font. Fill and outline go below the roads, the names on top.
- **Loading:** the file is requested only the first time Wards is selected (or `?layers=+wards`), never at load by default. If it cannot be loaded (for example it is not uploaded to the data host yet) the ward layers are removed, Wards is deselected and "Ward data is not available." is shown; selecting it again retries.
- **Hosting:** like the other published files, `hcmc-wards.geojson` must be uploaded by hand to the data host under `<MAP_HOST>/map/`; until then Wards works only in development.

## The data pipeline (`apps/cli`)

Commands are verb first, run through one root script, and have no program name:

```bash
pnpm cli <action> <target> [options]      # `pnpm cli` alone prints the list, add --help for one command
```

| Step | Command | What it does |
| --- | --- | --- |
| 1 | `pnpm cli fetch base-file` | Download the pinned Geofabrik Vietnam extract (`vietnam-260101.osm.pbf`, about 318 MB) with an md5 check. |
| 2 | `pnpm cli extract boundary` | `osmium tags-filter` the administrative relations, then `ogr2ogr` the Ho Chi Minh City relation (OSM relation `1973756`) to `apps/web/public/map/hcmc-boundary.geojson`. |
| 2b | `pnpm cli extract wards` | Read the city relation's `subarea` members from the same admin extract and `ogr2ogr` them (`admin_level` 6, 168 wards) to `apps/web/public/map/hcmc-wards.geojson`, simplified to about 5 m. See [The ward layer](#the-ward-layer). |
| 3 | `pnpm cli build roads --boundary apps/web/public/map/hcmc-boundary.geojson --name hcmc-roads` | Keep ways tagged `highway`, clip them to the boundary (`osmium extract`), write `apps/web/public/map/<name>.geojson` (`ogr2ogr`). 209,399 features, 80,498,401 bytes. |
| 4 | `pnpm cli build tiles --name hcmc-roads` | Prepare the features, then run tippecanoe into the published folder `apps/web/public/map/tiles/{z}/{x}/{y}.pbf` (21,304 tiles). |
| 4b | `pnpm cli build pmtiles --name hcmc-roads` | Same preparation and settings, written as `apps/web/public/map/<name>.pmtiles`; use `--name hcmc-roads` for the archive the app expects. |
| 5 | `pnpm cli check tiles` | Gzip every tile of the published folder and check budgets: 500,000 bytes per tile, 3,000,000 bytes for the initial view. Exit 1 when over budget. |
| 6 | `pnpm cli sweep tiles` | Optional: rebuild once per setting variant and write a size table (`tmp/data/tiles/sweep.md`); nothing is published. |

Published files go straight into `apps/web/public/map/` (gitignored), where the dev server and the upload to the data host read them. Intermediates stay in `tmp/data/` (also gitignored): the Vietnam PBF, filtered and clipped PBFs, and `<name>.prepared.geojsonl`. `build tiles` and `build pmtiles` default their input to `apps/web/public/map/hcmc-roads.geojson`.

`--name` for `build tiles` no longer names an output folder: the published folder is always `apps/web/public/map/tiles/`, and `--name` only names the prepared file and the log line, so a different `--name` replaces the published tiles. `check tiles --name X` reads an experiment folder `tmp/data/tiles/X` instead. `build tiles` and `build pmtiles` refuse to write through a leftover symlink. The command table is `COMMANDS` in `apps/cli/src/helpers/constants.ts`; each command is a numbered file in `apps/cli/src/entrypoints/`.

### How the tiles are made

1. **Prepare.** Stream the 80 MB GeoJSON line by line, keep only the attributes `highway` and `name` (dropping `osm_id`, `z_order` and the bulky `other_tags`), and add a per-feature `tippecanoe.minzoom` from the road class (below). The result is newline-delimited GeoJSON, 63.6 MB.
2. **Tile.** tippecanoe cuts layer `roads` into zooms 8 to 16 with `--drop-densest-as-needed --extend-zooms-if-still-dropping --read-parallel`. The folder build adds `--output-to-directory --no-tile-compression`; the PMTiles build writes a `.pmtiles` file instead (tiles gzipped inside).
3. **Check.** `check tiles` gzips each tile and compares against the budgets.

Road class to first zoom: motorway, trunk, primary from 8; secondary from 10; tertiary from 12; residential and unclassified from 13; service from 14; everything else (footway, path, track, ...) from 15. A `_link` follows its parent class.

Result of the default build:

| Measure | Value |
| --- | --- |
| Tiles | 21,304 (3 at z8, 105 at z12, 15,106 at z16) |
| Size | 33.9 MB raw, 22.1 MB gzipped (the PMTiles archive is 22,099,325 bytes) |
| Largest tile | 65 KB gzipped (budget 500 KB) |
| Initial view (z12, 1280 x 720) | 12 tiles requested, 11 exist, 184 KB gzipped (budget about 3 MB) |
| tippecanoe time | about 34 s |

### Settings sweep

Each row is a real build that changes one thing from the base (all attributes, every class from z8, dropping on). `chosen` combines pruning and class-by-zoom.

| Variant | Change | Tiles | Raw | Gzipped | Largest tile (gz) | Initial view (gz) |
| --- | --- | --- | --- | --- | --- | --- |
| no-dropping | base without dropping | failed: "No zoom levels were successfully written" | - | - | - | - |
| base | all attributes, all classes from z8 | 21,352 | 74.2 MB | 37.9 MB | 177 KB | 927 KB |
| prune | keep only `highway` and `name` | 21,352 | 44.0 MB | 27.3 MB | 204 KB | 903 KB |
| class-zoom | classes appear by zoom | 21,304 | 66.5 MB | 33.4 MB | 122 KB | 412 KB |
| detail-10 | `--full-detail 10` | 21,349 | 72.8 MB | 36.3 MB | 177 KB | 927 KB |
| simplify-4 | `--simplification 4` | 21,352 | 71.6 MB | 35.2 MB | 163 KB | 862 KB |
| max-zoom-14 | max zoom 14 | 1,818 | 35.5 MB | 15.8 MB | 177 KB | 927 KB |
| chosen | prune + class zoom | 21,304 | 33.9 MB | 22.1 MB | 65 KB | 184 KB |

Reading it: dropping features is required for this data. Attribute pruning is the biggest lever on total size (74.2 to 44.0 MB raw), class-by-zoom on the first screen (927 to 412 KB), and together they give 184 KB. `--full-detail` and `--simplification` change little. Max zoom 14 is much smaller but loses the detail of zooms 15 and 16. The sweep changes one factor at a time, so `chosen` is the only combined row. Pruning removes fields: a popup or filter that wants another OSM tag would need it kept.

## GIS concepts used

- **EPSG:4326 vs EPSG:3857.** 4326 is WGS 84 longitude/latitude in degrees, what GeoJSON stores (order `[lng, lat]`). 3857 is Web Mercator in metres, the grid web maps use, cut off near 85.05 degrees latitude. Both describe positions; the tools convert between them.
- **XYZ tile pyramid.** Zoom `z` splits the world into `2^z x 2^z` tiles, addressed `{z}/{x}/{y}` with x from the west and y from the north. Each zoom level splits every tile in four. MapLibre treats a vector tile as 512 px wide.
- **MVT (Mapbox Vector Tile).** A protobuf file per tile holding clipped, simplified geometry as integer coordinates plus attributes, organised in named layers (here `roads`). Styling happens in the browser.
- **tippecanoe.** Builds the pyramid from GeoJSON: clips to tiles, snaps and simplifies, and drops features in the densest places when a tile gets too big.
- **Attribute pruning.** Fewer properties per feature means smaller tiles; it reduces attribute payload, not geometry.
- **PMTiles and range requests.** One archive file with a header and a directory index. The client reads the index and fetches only the bytes of the tiles it needs with HTTP `Range` requests (`206 Partial Content`), so no tile server and no tens of thousands of small files. The host must support Range (and CORS, and expose `Content-Range`).
- **OSM model.** Nodes, ways, relations. Roads are ways tagged `highway`; the city boundary is a relation (`boundary=administrative`).
- **osmium extract strategies.** `simple` cuts ways at the polygon edge and needs little memory; `complete_ways` keeps border-crossing ways whole but was killed by the memory limit on whole-Vietnam highways.

## Benchmark

### Method

A run is **one clean page load** in one mode at the fixed view (centre `[106.7, 10.78]`, zoom 12, map box 1280 x 720, pixel ratio 1). It records, for the roads overlay only:

- **Bytes and requests:** MapLibre fetches overlay data in a worker, where the page's Resource Timing cannot see it. The roads source therefore goes through a custom `bench://` protocol whose handler runs on the main thread, tags each request with `?benchmark-run=<id>` and fetches it. After the run the tagged Resource Timing entries are summed (`encodedBodySize`, so bytes on the wire). PM Tiles reads go through a tagged range source in the same protocol (`apps/web/src/lib/benchmark/protocol.ts`); each range request must come back `206`, and a `200` (the server ignored `Range` and sent the whole file) fails the run. The range read itself is shared with the app (`fetchRange` in `apps/web/src/lib/map-layers/_pmtiles-source.ts`), so the benchmark and the app cannot drift apart.
- **Ready time:** from the **first data request** until the map is idle with the roads source loaded. The startup delay before the first request is recorded separately and not used in the comparison. (Measuring from page mount, as another site does, let a variable startup delay swing the result between 2 s and 13 s.)
- **Missing tiles:** a 404 (or an HTML 200 from the dev server) counts as "missing". That is normal for an empty area: it is left out of bytes and request count, shown as "Missing files". For GeoJSON a missing file fails the run.
- Runs that fail or exceed 120 s are excluded. The headline is the **median of ok runs**; at least 3 per mode is recommended. Runs are stored per variant (`geojson`, `folder`, `pmtiles`) in `localStorage`, and in development also appended to `tmp/benchmark/runs.json`.
- The benchmark view shows a per-mode summary, a comparison table, warnings (hidden tab, mixed viewports, slow startup, fewer than 3 runs) and "Copy as markdown table".

### Conditions

- Deployed site, data served from an external host, commit `9f6a0eb` (workflow run 39615022646), bundle `index-niCdIVWS.js`.
- Claude desktop app's built-in browser, a freshly opened pane in view for the whole batch; window 1680 x 958; every counted run was `ok` and `visible`, nothing was excluded.
- Data host throughput about 5 to 7 MB/s per stream; a plain round trip from the page to the data host took about 0.43 to 0.60 s (3 probes before the batch, 3 after).

### Latest batch: all three variants (2026-10-21 21:53 to 21:56, UTC+7, commit `9f6a0eb`)

Order: PM Tiles, Folder, GeoJSON (4 runs each, from 21:53:39), then a second pass of PM Tiles and Folder (3 runs each, from 21:55:12).

First pass (4 runs each):

| | GeoJSON | Tiles (Folder) | Tiles (PM Tiles) |
| --- | --- | --- | --- |
| Ready, median (range) | 9.29 s (8.74 to 10.27) | 0.88 s (0.78 to 0.93) | 1.65 s (1.48 to 1.72) |
| Network part, median | 5.86 s (plus 3.47 s after download) | 0.86 s | 1.64 s |
| Bytes on the wire | 14.8 MB | 372 KB | 207 KB |
| Requests | 1 | 11 (1 missing tile) | 13 range requests |

Ready per run, in order: GeoJSON 9.63, 8.95, 8.74, 10.27 s; Folder 0.93, 0.89, 0.87, 0.78 s; PM Tiles 1.60, 1.48, 1.72, 1.71 s.

Second pass (3 runs each): Folder 0.59, 0.51, 0.52 s (median 0.52 s); PM Tiles 1.44, 1.44, 1.67 s (median 1.44 s).

| | First pass | Second pass |
| --- | --- | --- |
| PM Tiles vs Folder | 1.9x slower (1.65 s vs 0.88 s) | 2.8x slower (1.44 s vs 0.52 s) |
| Folder vs GeoJSON | 10.6x faster (0.88 s vs 9.29 s) | not measured |
| PM Tiles vs GeoJSON | 5.6x faster (1.65 s vs 9.29 s) | not measured |

PM Tiles was not faster than Folder in any pass of this batch. Compare ratios within a pass, not seconds across batches.

### Caveats

- Both modes trend down over the first runs (cold start). The spread is wide for Folder, so treat its median as approximate; more runs would firm up the medians. The second pass has only 3 runs per variant.
- The batches were taken in one environment, one browser and one network path. Absolute times will differ elsewhere, and they moved between batches on the same setup.
- Runs flagged hidden or cut off were discarded (here, one PM Tiles run when the pane was resized). A hidden pane throttles timers and reports a 0 x 0 viewport; do not trust numbers taken that way.
- Earlier runs on other conditions (dev server, mixed pixel ratios) are not included.
- In benchmark mode the GeoJSON goes through the main thread (`fetch` and `response.json()`), so its after-download time includes parsing there, which the normal view does not do.
- The throttled-network set is not recorded.

## Decisions and gotchas

- **CLI grouping.** The pipeline was seven loose scripts run by path. They are now behind one entry, `pnpm cli <action> <target>`: verb first (reads like a sentence and matches the file names), no program name (a `bin` would need a built file; Node 24 runs the TypeScript directly), files named `<action>-<target>` and numbered by stage (`01-` to `08-`, in command order) so a directory listing reads in pipeline order. The command table maps names to files, so the numbers are never typed. The download is called the "base file" because it is the dataset every later step reads, not because it is Vietnam.
- **Runtime config instead of build-time env.** `MAP_HOST` is read from `/env-config.js` at runtime, not from a `VITE_*` variable, so one bundle serves any environment and the data location can change without a rebuild. `VITE_BASE_PATH` (the deploy sub-path) stays a build-time value.
- **Published files go straight into `apps/web/public/map`.** The CLI writes the boundary, wards, roads GeoJSON, tile folder and PMTiles archive there directly (no symlinks into `tmp/data`), and only intermediates stay in `tmp/data`. That folder is what the dev server serves and what gets uploaded to the data host.
- **Data is kept out of the bundle.** `apps/web/public/map` is gitignored; the data lives on a separate public host, which is why CORS, `Timing-Allow-Origin` and Range requirements apply.
- **MapLibre worker shipped as `.js`.** MapLibre 6 loads `maplibre-gl-worker.mjs` as a sibling of the script and the bundle drops it, so a Vite plugin emits it. It is emitted as `assets/maplibre-gl-worker.js` because the host serves `.mjs` as `application/octet-stream`, which browsers reject for module workers.
- **Folder tiles are uncompressed, PMTiles tiles are gzipped.** The folder is built with `--no-tile-compression` so any static host can serve it, and the host in front of it did not compress `.pbf`, so the 11 initial-view tiles cost 372,346 bytes on the wire, exactly their raw size. `check tiles` judges budgets on gzipped size (184 KB for the same view), which is what a compressing host would send. tippecanoe compresses tiles inside a PMTiles archive by default, so the archive is about 22.1 MB, close to the folder's gzipped total. That is why the same tiles are 372 KB as a folder and 207 KB as PM Tiles on the wire; keep that in mind when comparing bytes, it is a property of how each was built and served, not of the format.
- **`simple` extract strategy.** `complete_ways` was killed above about 3.3 GiB on whole-Vietnam highways; `simple` needs about 47 MiB and loses about 0.2% of features (roads cut at the border).
- **Fixed benchmark box and pixel ratio.** The viewport decides how many tiles load and the pixel ratio decides drawing work, so both are pinned. Mode switches reload the page so no warm heap or reused worker leaks into a run. The map is torn down (`map.remove()`) before a reload, because repeated 80 MB GeoJSON loads in one tab otherwise grew the renderer's memory.
- **Dev server quirk.** Vite answers a missing file with `index.html` and status 200. In the normal (non-benchmark) view a missing tile can therefore be parsed as a tile and log an error; the benchmark protocol treats it as "missing".
- **Roads are what is measured.** No points of interest. The city boundary is drawn in every mode but is not routed through the benchmark protocol, so it does not change the measured bytes; the ward layer is an optional extra that is loaded lazily and never in the benchmark view, for the same reason.

## Data and attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under the [ODbL](https://opendatacommons.org/licenses/odbl/). The extract comes from [Geofabrik](https://download.geofabrik.de/asia/vietnam.html) (snapshot `vietnam-260101`). The basemap is [OpenFreeMap](https://openfreemap.org/). The generated data is not part of this repository.
