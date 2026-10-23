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

The app needs the map data under `apps/web/public/map/` (gitignored). The CLI writes its published files (boundary, wards and roads GeoJSON, tile folder, PMTiles archive) straight there, with no symlinks: build them as described in [The data pipeline](#the-data-pipeline-appscli), or set `MAP_HOST` to a host that already has them.

### 3. URL parameters

| Parameter                                          | Effect                                                                                                                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `?mode=tiles` (default) / `?mode=geojson`          | Which roads source loads. Anything other than `geojson` means tiles.                                                                                                                |
| `?tileMode=folder` (default) / `?tileMode=pmtiles` | Tiles from the `{z}/{x}/{y}.pbf` folder, or from the PM Tiles archive. Only used in tiles mode. Case-insensitive; `pm tiles` (the label) works too, and anything else means Folder. |
| `?benchmark`                                       | Opens the benchmark view (fixed 1280 x 720 map box, pixel ratio pinned to 1, run panels). It draws every layer group, roads and wards, in every variant.                            |
| `?benchmark&run`                                   | That page load records one benchmark run, then `run` is dropped from the URL so a manual reload does not record again. The "Run" button reloads the page with it.                   |

Switching mode or tile mode in the toolbar reloads the page, so every run is a clean page load.

## Manual setup (without the dev container)

The dev container only bundles the tools below. You can install them yourself on macOS or Linux.

| Tool                   | Needed for                                         | Notes                                                                                      |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Node 24                | web app and CLI                                    | The CLI is TypeScript that Node 24 runs directly, so older Node will not work.             |
| Vite+ (`vp`)           | `vp install`, `vp dev`, `vp check`                 | Install it following the Vite+ docs. It pins and downloads pnpm 12.11.2 from `devEngines`. |
| `osmium` (osmium-tool) | `extract boundary`, `extract wards`, `build roads` |                                                                                            |
| `ogr2ogr` (GDAL)       | `extract boundary`, `extract wards`, `build roads` | GDAL needs the OSM driver, which the usual packages include.                               |
| `tippecanoe`           | `build tiles`, `build pmtiles`, `sweep tiles`      | Version 2.x; `build pmtiles` needs a build that can write `.pmtiles`.                      |
| `jq`                   | optional                                           | Only for inspecting data by hand.                                                          |

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
- **Data pipeline:** all three GIS tools must be on your `PATH`. Every CLI command checks for them first and stops with an error naming any that are missing. With the default `simple` extract strategy the roads step needed about 47 MiB of memory on the full Vietnam extract; `complete_ways` was killed above about 3.3 GiB (see [Border roads and the `simple` strategy](#border-roads-and-the-simple-strategy)).
- The dev container creates an empty `.env` for you; without it, create one yourself only if you want to set `MAP_HOST`.

## Project structure

```text
apps/cli   data pipeline: OSM extract -> boundary, wards, roads GeoJSON -> tiles (folder or PMTiles) -> checks
apps/web   Vue 3 + MapLibre GL JS app with a benchmark view
data       hosted separately on an external host, read by the app at runtime
```

- **`apps/cli`** is erasable TypeScript that Node 24 runs directly (no build step). It shells out to `osmium`, `ogr2ogr` and `tippecanoe`.
- **`apps/web`** is Vue 3, MapLibre GL JS 6, Tailwind 4 and shadcn-vue, built with Vite+ (`vp`). The `pmtiles` npm package lets MapLibre read the archive.
- **The map data is not in the repo and not in the deployed bundle.** It is generated locally by the CLI and uploaded by hand to a public bucket on an external host (the files in `apps/web/public/map/` that the app reads, see the table below). The app finds it through `MAP_HOST` (below).
- **Deploy:** a manual GitHub Actions workflow (`.github/workflows/deploy.yml`, `workflow_dispatch`, only from `challenge/gis`) builds `apps/web` on a GitHub runner, writes `env-config.js` into `dist/`, then `rsync`s `dist/` to an external host over SSH. The site is served at `/dev-challenge-gis/`, so the build sets `VITE_BASE_PATH`.
- **Basemap:** OpenFreeMap "liberty" style. The roads and the wards are what is measured.

### Runtime config: `MAP_HOST`

The data location is **not** a build-time variable. `index.html` loads `/env-config.js`, which sets `window.__ENV__ = { MAP_HOST }`, and `apps/web/src/constants/endpoints.ts` builds every data URL from it:

| Data                            | URL                                                |
| ------------------------------- | -------------------------------------------------- |
| Roads GeoJSON                   | `<MAP_HOST>/map/hcmc-roads.geojson`                |
| Boundary GeoJSON                | `<MAP_HOST>/map/hcmc-boundary.geojson`             |
| Wards GeoJSON                   | `<MAP_HOST>/map/hcmc-wards.geojson`                |
| Tile folder (roads + wards)     | `<MAP_HOST>/map/tiles-roads-wards/{z}/{x}/{y}.pbf` |
| PMTiles archive (roads + wards) | `<MAP_HOST>/map/hcmc-roads-wards.pmtiles`          |

- `MAP_HOST` is an origin, optionally followed by a path prefix (production: a path prefix on the external data host). Unset means same origin, which is the local `apps/web/public/map` folder.
- In development a Vite plugin answers `/env-config.js` from `MAP_HOST` in the environment or `.env` files (see `.env.example`). In CI the workflow overwrites `dist/env-config.js` from the `MAP_HOST` repository variable. One built bundle can therefore run against any data host.
- The values reach the browser, so they are **public**. No secrets belong in them.
- A data host on another origin must send **CORS** headers, **`Timing-Allow-Origin`** (otherwise cross-origin Resource Timing reports 0 bytes and the benchmark cannot count) and support HTTP **Range** requests (PM Tiles).

## Results at a glance

Initial view (zoom 12, centre of the city), map box 1280 x 720 at pixel ratio 1. Every benchmark variant carries and draws **roads and wards**. Latest batch: median of 5 runs per variant, recorded 2026-10-23 on commit `b5a3ba3` in the real Chrome with Claude in Chrome (tab visible and in front for every run, none hidden), **dev server on localhost (`localhost:5173`) with the data from `apps/web/public/map`, not the deployed host**. The older batches used other commits (see [Benchmark](#benchmark)), so their speed-up factors do not describe this build.

|                                                  | GeoJSON                                      | Tiles (Folder) | Tiles (PM Tiles)  |
| ------------------------------------------------ | -------------------------------------------- | -------------- | ----------------- |
| Ready (first data request until the map is idle) | 15.5 s (4.8 to 19.5, **machine under load**) | 0.41 s         | 0.55 s            |
| Overlay bytes                                    | 81.4 MB (uncompressed from the dev server)   | 403 KB         | 232 KB            |
| Total bytes with the boundary (588 KB)           | 82.0 MB                                      | 990 KB         | 820 KB            |
| Requests                                         | 2 (roads + wards)                            | 12             | 14 range requests |

How to read this:

- **The GeoJSON time in this batch is not reliable.** The machine was under heavy load while it ran (load average about 8.6, 9.2 of 10 GB of swap in use) and the 80 MB parse is the part that suffers: the five runs went 4.8, 8.6, 19.5, 15.5 and 17.4 s, almost all of it after the download (median 14.8 s of 15.5 s). The first run, 4.8 s, matches the previous batch (4.86 s median). Treat GeoJSON as "about 5 s on an idle machine, much worse under memory pressure"; a clean rerun on an idle machine is still to be done. The tile runs were steady (Folder 0.38 to 0.48 s, PM Tiles 0.45 to 0.55 s).
- **Bytes and requests are the steady headline** and were identical in every run of a variant. PM Tiles reads the fewest bytes (232 KB, 42 % fewer than Folder's 403 KB) but was 1.3x slower than Folder in the median (0.55 s against 0.41 s). With the boundary file included the tile modes are 1.0 MB and 0.8 MB against 82 MB.
- Seconds depend on where the data is served from. These runs read from the local dev server over loopback, so they say nothing about a real network; the GeoJSON size is its raw size because the dev server does not compress (the deployed host serves brotli).
- The same tiles cost 403 KB as a folder and 232 KB as PM Tiles because the folder is built with `--no-tile-compression` (plain `.pbf`) and PMTiles gzips each tile by default; the PM Tiles figure includes the header and directory reads.
- The throttled-network set (slow network, CPU slowdown) is still to be recorded.

Full method, per-run numbers and caveats are in [Benchmark](#benchmark), together with the earlier **roads-only** batch from the deployed site (GeoJSON 9.29 s, Folder 0.88 s, PM Tiles 1.65 s), which is not comparable in seconds because it ran on another network path.

## The data pipeline (`apps/cli`)

Commands are verb first, run through one root script, and have no program name:

```bash
pnpm cli <action> <target> [options]      # `pnpm cli` alone prints the list, add --help for one command
```

| Step | Command                                                                                       | What it does                                                                                                                                                                                                                                                                                                                                                                 |
| ---- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `pnpm cli fetch base-file`                                                                    | Download the pinned Geofabrik Vietnam extract (`vietnam-260101.osm.pbf`, about 318 MB) with an md5 check.                                                                                                                                                                                                                                                                    |
| 2    | `pnpm cli extract boundary`                                                                   | `osmium tags-filter` the administrative relations, then `ogr2ogr` the Ho Chi Minh City relation (OSM relation `1973756`) to `apps/web/public/map/hcmc-boundary.geojson`.                                                                                                                                                                                                     |
| 3    | `pnpm cli extract wards`                                                                      | Read the `subarea` members of the same relation (the wards: 168, with `admin_level=6` in this snapshot), `ogr2ogr` them with `-simplify` and 5 coordinate decimals, keep `osm_id` and `name`, write `apps/web/public/map/hcmc-wards.geojson` (938,850 bytes, 234,629 gzipped). Options: `--relation`, `--pbf`, `--out`, `--simplify <degrees>` (default 0.00005, about 5 m). |
| 4    | `pnpm cli build roads --boundary apps/web/public/map/hcmc-boundary.geojson --name hcmc-roads` | Keep ways tagged `highway`, extract the ones with a node inside the boundary (`osmium extract`, strategy `simple`: a road that leaves the city is cut at its last node inside, not at the exact edge), write `apps/web/public/map/<name>.geojson` (`ogr2ogr`). 209,399 features, 80,498,401 bytes.                                                                           |
| 5    | `pnpm cli build tiles --name hcmc-roads-wards`                                                | Prepare the roads and the wards, then run tippecanoe into the published folder `apps/web/public/map/tiles-roads-wards/{z}/{x}/{y}.pbf` (26,837 tiles), with the source-layers `roads` and `wards`.                                                                                                                                                                           |
| 6    | `pnpm cli build pmtiles --name hcmc-roads-wards`                                              | Same preparation and settings, written as `apps/web/public/map/<name>.pmtiles`; use `--name hcmc-roads-wards` for the archive the app expects (24,923,360 bytes).                                                                                                                                                                                                            |
| 7    | `pnpm cli check tiles`                                                                        | Gzip every tile of the published folder and check budgets: 500,000 bytes per tile, 3,000,000 bytes for the initial view. Exit 1 when over budget.                                                                                                                                                                                                                            |
| 8    | `pnpm cli sweep tiles`                                                                        | Optional: rebuild the roads once per setting variant (without the wards) and write a size table (`tmp/data/tiles/sweep.md`); nothing is published.                                                                                                                                                                                                                           |

Steps 2 and 3 share one filtered file, `tmp/data/vn-admin.osm.pbf`; `extract wards` reuses it when it exists and rebuilds it only when it is missing or `--pbf` is given. `extract wards` fails if a ward is not a named polygon or has another `admin_level`, or if the feature count differs from the member count.

Published files go straight into `apps/web/public/map/` (gitignored), where the dev server and the upload to the data host read them. Intermediates stay in `tmp/data/` (also gitignored): the Vietnam PBF, filtered and clipped PBFs, `<name>.prepared.geojsonl` and `<name>.prepared-wards.geojsonl`. `build tiles` and `build pmtiles` default their roads input to `apps/web/public/map/hcmc-roads.geojson` (`--input`) and their wards input to `apps/web/public/map/hcmc-wards.geojson` (`--wards`).

`build tiles` and `build pmtiles` take the same options: `--name` (required), `--input`, `--wards <file>` or `--no-wards` (not both), `--min-zoom`, `--max-zoom`, `--full-detail`, `--simplification`, `--no-drop`, `--no-class-zoom`, `--all-attributes`. `--name` for `build tiles` does not name the published folder: with the wards the folder is always `apps/web/public/map/tiles-roads-wards/`, and `--name` only names the prepared files and the log line, so a different `--name` still replaces the published tiles. With `--no-wards` the roads-only tiles go to the experiment folder `tmp/data/tiles/<name>` instead. For `build pmtiles`, `--name` names the archive (`apps/web/public/map/<name>.pmtiles`, with or without wards). `check tiles` reads the published folder; `check tiles --name X` reads an experiment folder `tmp/data/tiles/X` instead. `build tiles` and `build pmtiles` refuse to write through a leftover symlink. The command table is `COMMANDS` in `apps/cli/src/helpers/constants.ts`; each command is a numbered file in `apps/cli/src/entrypoints/` (`01-fetch-base-file.ts` to `08-sweep-tiles.ts`, in the step order above).

### How the tiles are made

1. **Prepare.** Stream the 80 MB roads GeoJSON line by line, keep only the attributes `highway` and `name` (dropping `osm_id`, `z_order` and the bulky `other_tags`), and add a per-feature `tippecanoe.minzoom` from the road class (below). The result is newline-delimited GeoJSON, 63.6 MB. The ward polygons are written the same way (one feature per line, 943,513 bytes), keeping only `name` and `osm_id` (the web app picks a ward's fill tint from the id) with `tippecanoe.minzoom` 10.
2. **Tile.** tippecanoe cuts layer `roads` and layer `wards` (`-Lroads:... -Lwards:...`) with `--minimum-zoom=8 --maximum-zoom=16` (the first tile that exists is at zoom 10, see below), `--drop-densest-as-needed --extend-zooms-if-still-dropping --read-parallel`. The wards run to the maximum zoom too, because MapLibre overzooms a whole source and a lower ward maximum would hide the wards at street level. The folder build adds `--output-to-directory --no-tile-compression`; the PMTiles build writes a `.pmtiles` file instead (tiles gzipped inside). `--no-wards` builds the roads alone as a single `--layer=roads`.
3. **Check.** `check tiles` gzips each tile and compares against the budgets.

Road class to first zoom: motorway, trunk, primary, secondary and tertiary from 12; residential and unclassified from 13; service from 14; everything else (footway, path, track, ...) from 15. A `_link` follows its parent class. Wards appear from zoom 10. Below zoom 12 no road is drawn, so the map shows only the wards (from zoom 10) and the boundary at the city-wide zooms, and the tiles start at zoom 10 (the PMTiles header still says minimum zoom 8, from tippecanoe's `--minimum-zoom`, but no tile exists below 10).

Result of the default build (roads and wards, measured with `check tiles` on the published folder):

| Measure                        | Value                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Tiles                          | 26,837 (z10 17, z11 41, z12 123, z13 402, z14 1,411, z15 5,164, z16 19,679; none at z8 or z9)                           |
| Size                           | 36.8 MB raw (36,824,882 bytes), 25.3 MB gzipped (25,290,083 bytes); the PMTiles archive is 24,923,360 bytes             |
| Largest tile                   | 65 KB gzipped (65,235 bytes, tile 13/6522/3849; 13 % of the 500 KB budget)                                              |
| Initial view (z12, 1280 x 720) | 12 tiles requested, 12 exist, 208 KB gzipped (budget about 3 MB)                                                        |
| Build time (this machine)      | `build tiles` 70.8 s in tippecanoe (prepare 0.98 s); `build pmtiles` 69.4 s in total (prepare 1.7 s, tippecanoe 67.7 s) |

For comparison, the roads-only build measured earlier (before the wards and before the roads moved to zoom 12, so the arteries still started at z8; now `--no-wards`): 21,304 tiles (3 at z8, 105 at z12, 15,106 at z16), 33.9 MB raw, 22.1 MB gzipped (PMTiles 22,099,325 bytes), largest tile 65 KB, initial view 11 of 12 tiles existing, 184 KB gzipped, tippecanoe about 34 s on an idle machine. That time is for the roads-only build and is not comparable with the 70.8 s of the combined build above.

### Settings sweep

Each row is a real build that changes one thing from the base (all attributes, every class from z8, dropping on). `chosen` combines pruning and class-by-zoom. The sweep builds the roads only (no wards, into `tmp/data/tiles/sweep-<variant>`, deleted afterwards unless `--keep`), so the table is the roads-only numbers and its `chosen` row is the earlier roads-only default build (the one in the comparison above), not the current one.

The sweep numbers were measured with the earlier class-zoom rule (motorway, trunk and primary from z8, secondary from z10); the `class-zoom` and `chosen` rows would differ now that all five main classes start at z12. The sweep has not been re-run since the roads moved to z12.

| Variant     | Change                              | Tiles                                              | Raw     | Gzipped | Largest tile (gz) | Initial view (gz) |
| ----------- | ----------------------------------- | -------------------------------------------------- | ------- | ------- | ----------------- | ----------------- |
| no-dropping | base without dropping               | failed: "No zoom levels were successfully written" | -       | -       | -                 | -                 |
| base        | all attributes, all classes from z8 | 21,352                                             | 74.2 MB | 37.9 MB | 177 KB            | 927 KB            |
| prune       | keep only `highway` and `name`      | 21,352                                             | 44.0 MB | 27.3 MB | 204 KB            | 903 KB            |
| class-zoom  | classes appear by zoom              | 21,304                                             | 66.5 MB | 33.4 MB | 122 KB            | 412 KB            |
| detail-10   | `--full-detail 10`                  | 21,349                                             | 72.8 MB | 36.3 MB | 177 KB            | 927 KB            |
| simplify-4  | `--simplification 4`                | 21,352                                             | 71.6 MB | 35.2 MB | 163 KB            | 862 KB            |
| max-zoom-14 | max zoom 14                         | 1,818                                              | 35.5 MB | 15.8 MB | 177 KB            | 927 KB            |
| chosen      | prune + class zoom                  | 21,304                                             | 33.9 MB | 22.1 MB | 65 KB             | 184 KB            |

Reading it: dropping features is required for this data. Attribute pruning is the biggest lever on total size (74.2 to 44.0 MB raw), class-by-zoom on the first screen (927 to 412 KB), and together they gave 184 KB (with the earlier rule). `--full-detail` and `--simplification` change little. Max zoom 14 is much smaller but loses the detail of zooms 15 and 16. The sweep changes one factor at a time, so `chosen` is the only combined row. Pruning removes fields: a popup or filter that wants another OSM tag would need it kept.

### Border roads and the `simple` strategy

Checked on 2026-10-23 with osmium 1.15.0 and GDAL 3.6.2 (`osmium extract -s simple`, then `ogr2ogr ... lines`):

- `simple` keeps a way if at least one of its nodes is inside the polygon; the nodes outside are not in the file, so GDAL draws only the part with known nodes. The road therefore ends at its last inside node, which can be a little before the polygon edge. A way with all its nodes outside is not extracted at all, even if one of its segments crosses the polygon; that case is not measured here, because it needs the complete data that `complete_ways` could not produce.
- On the stored HCMC data (210,032 ways in the extract, 209,399 features in the GeoJSON): **130 ways (0.06%) are cut at the border**, and **633 ways (0.30%) are missing from the GeoJSON**. Of those 633, **471 are closed rings** (roundabouts, pedestrian areas), which GDAL exports to its polygon layer, not to `lines`; **162 (0.08%) are open ways with only one node inside**, a single point, which is no line. So the earlier "loses about 0.2% of features (roads cut at the border)" blamed the border for most of what is the ring handling.
- A small polygon over Monaco shows the same split: 2,215 ways, 2,192 features, 23 missing (20 rings, 3 single-node), 22 cut.
- `complete_ways` was killed (exit 137) here even on the small Monaco extract and on a padded HCMC bounding box, so it could not be used as the reference in this environment.
- Closed rings are therefore the larger gap. The map does not draw them as roads; whether they should be is a separate question, not changed here.

## GIS concepts used

- **EPSG:4326 vs EPSG:3857.** 4326 is WGS 84 longitude/latitude in degrees, what GeoJSON stores (order `[lng, lat]`). 3857 is Web Mercator in metres, the grid web maps use, cut off near 85.05 degrees latitude. Both describe positions; the tools convert between them.
- **XYZ tile pyramid.** Zoom `z` splits the world into `2^z x 2^z` tiles, addressed `{z}/{x}/{y}` with x from the west and y from the north. Each zoom level splits every tile in four. MapLibre treats a vector tile as 512 px wide.
- **MVT (Mapbox Vector Tile).** A protobuf file per tile holding clipped, simplified geometry as integer coordinates plus attributes, organised in named layers (here `roads`). Styling happens in the browser.
- **tippecanoe.** Builds the pyramid from GeoJSON: clips to tiles, snaps and simplifies, and drops features in the densest places when a tile gets too big.
- **Attribute pruning.** Fewer properties per feature means smaller tiles; it reduces attribute payload, not geometry.
- **PMTiles and range requests.** One archive file with a header and a directory index. The client reads the index and fetches only the bytes of the tiles it needs with HTTP `Range` requests (`206 Partial Content`), so no tile server and no tens of thousands of small files. The host must support Range (and CORS, and expose `Content-Range`).
- **OSM model.** Nodes, ways, relations. Roads are ways tagged `highway`; the city boundary is a relation (`boundary=administrative`).
- **osmium extract strategies.** `simple` keeps every way that has at least one node inside the polygon and leaves out the nodes outside it, so a road that crosses the border is cut at its last inside node (not at the exact edge) and needs little memory; `complete_ways` keeps border-crossing ways whole but was killed by the memory limit on whole-Vietnam highways. See [Border roads and the `simple` strategy](#border-roads-and-the-simple-strategy).

## Benchmark

### Method

A run is **one clean page load** in one mode at the fixed view (centre `[106.7, 10.78]`, zoom 12, map box 1280 x 720, pixel ratio 1). It records, for the data overlay (the roads and, since 2026-10-22, the wards):

- **Bytes and requests:** MapLibre fetches overlay data in a worker, where the page's Resource Timing cannot see it. The data sources (the roads, and in GeoJSON mode the ward file) therefore go through a custom `bench://` protocol whose handler runs on the main thread, tags each request with `?benchmark-run=<id>` and fetches it. After the run the tagged Resource Timing entries are summed (`encodedBodySize`, so bytes on the wire). PM Tiles reads go through a tagged range source in the same protocol (`apps/web/src/lib/benchmark/_protocol.ts`); each range request must come back `206`, and a `200` (the server ignored `Range` and sent the whole file) fails the run. The range read itself is shared with the app (`fetchRange` in `apps/web/src/lib/map-layers/_pmtiles-source.ts`), so the benchmark and the app cannot drift apart.
- **Ready time:** from the **first data request** until the map is idle with the roads source loaded (in GeoJSON mode the ward source too; in the tile modes the wards arrive inside the tiles). The startup delay before the first request is recorded separately and not used in the comparison. (Measuring from page mount, as another site does, let a variable startup delay swing the result between 2 s and 13 s.)
- **Missing tiles:** a 404 (or an HTML 200 from the dev server) counts as "missing". That is normal for an empty area: it is left out of bytes and request count, shown as "Missing files". For GeoJSON a missing file fails the run.
- Runs that fail or exceed 120 s are excluded, and so is any run from a tab that was hidden at any point (flagged `hidden`: timers and rendering are throttled). They stay in the store and are shown as "hidden-tab (not counted)". The headline is the **median of counted runs** (ok and never hidden); at least 3 per mode is recommended. Runs are stored per variant (`geojson`, `folder`, `pmtiles`) in `localStorage` under the key `dev-prep-benchmark-runs-v2`, and in development also appended to `tmp/benchmark/runs-v2.json`. The `-v2` store holds the roads + wards runs only; the earlier roads-only runs (`-v1`, `runs.json`) are never mixed in.
- **All variants draw the same content.** The benchmark view draws every layer group whatever `?layers` says, so the three variants carry and render roads and wards alike: the tile modes get the wards inside the same tiles (no extra request), and the GeoJSON variant also loads `hcmc-wards.geojson` through the protocol, which counts its request and bytes and makes "ready" wait for it.
- **Bytes with the boundary:** the city boundary is a plain GeoJSON source the map fetches in a worker, outside the protocol, so it is not in the overlay bytes. After the run (so it cannot change the timing) the page fetches it once more, tagged `?benchmark-boundary=`, and stores its wire size as `boundaryBytes`. The view shows it as "Total with boundary" (overlay bytes plus the boundary, 587,641 B on the local dev server). Runs stored before this was added have no value, so that row shows `-` until new runs are recorded.
- The benchmark view shows a per-mode summary, a comparison table, warnings (hidden tab, mixed viewports, slow startup, fewer than 3 runs) and "Copy as markdown table".

### Conditions

Latest batch (roads + wards, 2026-10-23, commit `b5a3ba3`, 5 runs per variant):

- Claude in Chrome driving the real Chrome, the tab visible and in front for every run (`visibility: visible`; nothing hidden, nothing excluded). The earlier stored runs were cleared first, so the medians contain only this batch.
- **Run on localhost:** the dev server on `localhost:5173` with the data read from the local `apps/web/public/map` (not the deployed bundle and not the external data host), map box 1280 x 720, pixel ratio 1, one clean page load per run (`?benchmark&run`).
- **Machine state:** load average about 8.6 and 9.2 of 10 GB swap in use while the GeoJSON runs were taken, which inflated them (see the table). The PM Tiles and Folder runs came first, a few minutes earlier.

Previous batch (roads + wards, 2026-10-22, commit `9472cc1`, before the hidden-run rule and the boundary row):

- Claude in Chrome driving the real Chrome, the tab visible and in front for every run; every counted run was `ok` and `visible`, nothing was excluded.
- The dev server on `localhost:5173` with the data read from the local `apps/web/public/map` (not the deployed bundle and not the external data host), map box 1280 x 720, pixel ratio 1, one clean page load per run (`?benchmark&run`), 3 runs per variant.

### Latest batch: roads + wards in all three variants (2026-10-23, commit `b5a3ba3`)

|                       | GeoJSON (roads + wards files)          | Tiles (Folder, combined) | Tiles (PM Tiles, combined) |
| --------------------- | -------------------------------------- | ------------------------ | -------------------------- |
| Ready, median (range) | 15.48 s (4.77 to 19.49) **under load** | 0.41 s (0.38 to 0.48)    | 0.55 s (0.45 to 0.55)      |
| Network part, median  | 0.90 s (plus 14.76 s after download)   | 0.07 s                   | 0.17 s                     |
| Overlay bytes         | 81,437,251 (80,498,401 + 938,850)      | 402,849                  | 232,005                    |
| Total with boundary   | 82,024,892                             | 990,490                  | 819,646                    |
| Requests              | 2                                      | 12                       | 14 range requests          |
| Missing files         | 0                                      | 0                        | 0                          |

Ready per run, in order: GeoJSON 4.77, 8.56, 19.49, 15.48, 17.39 s; Folder 0.41, 0.44, 0.38, 0.48, 0.41 s; PM Tiles 0.55, 0.55, 0.55, 0.45, 0.52 s. The boundary file is 587,641 B in every run. Requests and bytes were identical across the runs of each variant; PM Tiles is 22 B smaller than in the previous batch (232,005 against 232,027), which is the range reads, not the data.

Against the previous batch (same machine and dev server): Folder 0.50 s then, 0.41 s now; PM Tiles 0.56 s then, 0.55 s now; GeoJSON 4.86 s then and 15.5 s now only because of the load above (its first run was 4.77 s). No speed-up factor between GeoJSON and the tiles is claimed for this batch.

### Previous batch: roads + wards in all three variants (2026-10-22, commit `9472cc1`)

|                       | GeoJSON (roads + wards files)       | Tiles (Folder, combined) | Tiles (PM Tiles, combined) |
| --------------------- | ----------------------------------- | ------------------------ | -------------------------- |
| Ready, median (range) | 4.86 s (4.81 to 5.19)               | 0.50 s (0.41 to 0.51)    | 0.56 s (0.20 to 0.62)      |
| Network part, median  | 1.01 s (plus 3.80 s after download) | 0.08 s                   | 0.18 s                     |
| Bytes                 | 81,437,251 (80,498,401 + 938,850)   | 402,849                  | 232,027                    |
| Requests              | 2                                   | 12                       | 14 range requests          |
| Missing files         | 0                                   | 0                        | 0                          |

Ready per run, in order: GeoJSON 4.81, 4.86, 5.19 s; Folder 0.50, 0.41, 0.51 s; PM Tiles 0.56, 0.62, 0.20 s. Requests and bytes were identical in all three runs of each variant.

| Against the roads-only numbers | Before                              | After                    | Change                                                                   |
| ------------------------------ | ----------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| GeoJSON                        | 1 request, 80,498,401 B             | 2 requests, 81,437,251 B | +938,850 B (+1.2 %)                                                      |
| Folder                         | 11 requests (+1 missing), 372,346 B | 12 requests, 402,849 B   | +30,503 B (+8.2 %); the missing tile now exists (a 106 B ward-only tile) |
| PM Tiles                       | 13 requests, 206,973 B              | 14 requests, 232,027 B   | +25,054 B (+12.1 %)                                                      |

The older roads-only runs of the same machine and dev server (visible tab) give a Folder ready median of 0.09 s (9 runs) and a GeoJSON median of 4.62 s (4 runs); Folder is therefore about 5x slower with the wards, still half a second, and GeoJSON about 5 % slower. The cause of the Folder increase is not isolated (drawing the ward fill, outline and names at the start view, the larger tiles and run-to-run effects are all candidates). The earlier PM Tiles runs on this setup were taken with a hidden tab, so there is no like-for-like comparison for it.

### Earlier batch: roads only, deployed site (2026-10-21 21:53 to 21:56, UTC+7, commit `9f6a0eb`)

Before the wards were part of the benchmark. Conditions:

- Deployed site, data served from an external host, commit `9f6a0eb` (workflow run 39615022646), bundle `index-niCdIVWS.js`.
- Claude desktop app's built-in browser, a freshly opened pane in view for the whole batch; window 1680 x 958; every counted run was `ok` and `visible`, nothing was excluded.
- Data host throughput about 5 to 7 MB/s per stream; a plain round trip from the page to the data host took about 0.43 to 0.60 s (3 probes before the batch, 3 after).

Order: PM Tiles, Folder, GeoJSON (4 runs each, from 21:53:39), then a second pass of PM Tiles and Folder (3 runs each, from 21:55:12).

First pass (4 runs each):

|                       | GeoJSON                             | Tiles (Folder)        | Tiles (PM Tiles)      |
| --------------------- | ----------------------------------- | --------------------- | --------------------- |
| Ready, median (range) | 9.29 s (8.74 to 10.27)              | 0.88 s (0.78 to 0.93) | 1.65 s (1.48 to 1.72) |
| Network part, median  | 5.86 s (plus 3.47 s after download) | 0.86 s                | 1.64 s                |
| Bytes on the wire     | 14.8 MB                             | 372 KB                | 207 KB                |
| Requests              | 1                                   | 11 (1 missing tile)   | 13 range requests     |

Ready per run, in order: GeoJSON 9.63, 8.95, 8.74, 10.27 s; Folder 0.93, 0.89, 0.87, 0.78 s; PM Tiles 1.60, 1.48, 1.72, 1.71 s.

Second pass (3 runs each): Folder 0.59, 0.51, 0.52 s (median 0.52 s); PM Tiles 1.44, 1.44, 1.67 s (median 1.44 s).

|                     | First pass                      | Second pass                    |
| ------------------- | ------------------------------- | ------------------------------ |
| PM Tiles vs Folder  | 1.9x slower (1.65 s vs 0.88 s)  | 2.8x slower (1.44 s vs 0.52 s) |
| Folder vs GeoJSON   | 10.6x faster (0.88 s vs 9.29 s) | not measured                   |
| PM Tiles vs GeoJSON | 5.6x faster (1.65 s vs 9.29 s)  | not measured                   |

PM Tiles was not faster than Folder in any pass of this batch. Compare ratios within a pass, not seconds across batches.

### Caveats

- **Latest batch is local.** Its seconds come from the dev server over loopback and cannot be compared with the earlier deployed-site batch above; compare bytes and requests across the two, and ratios only within one batch. A deployed batch with the combined data is not recorded yet.
- **Latest batch: the GeoJSON seconds were taken under memory pressure** (swap nearly full) and are not a stable figure; the tile runs are steady. Rerun GeoJSON on an idle machine before quoting a GeoJSON-versus-tiles factor.
- **Latest batch has 5 runs per variant**, none hidden; the previous batch had 3.
- In the earlier batch both modes trend down over the first runs (cold start). The spread is wide for Folder, so treat its median as approximate; more runs would firm up the medians. The second pass has only 3 runs per variant.
- The batches were taken in one environment, one browser and one network path. Absolute times will differ elsewhere, and they moved between batches on the same setup.
- Runs flagged hidden or cut off were discarded (here, one PM Tiles run when the pane was resized). A hidden pane throttles timers and reports a 0 x 0 viewport; do not trust numbers taken that way.
- The earlier batch left out dev-server runs and mixed pixel ratios; the latest batch is a dev-server batch.
- In benchmark mode the GeoJSON goes through the main thread (`fetch` and `response.json()`), so its after-download time includes parsing there, which the normal view does not do.
- The throttled-network set is not recorded.

## Decisions and gotchas

- **CLI grouping.** The pipeline was seven loose scripts run by path. They are now behind one entry, `pnpm cli <action> <target>`: verb first (reads like a sentence and matches the file names), no program name (a `bin` would need a built file; Node 24 runs the TypeScript directly), files named `<action>-<target>` and numbered by stage (`01-` to `08-`) so a directory listing reads in pipeline order. The command table maps names to files, so the numbers are never typed. The download is called the "base file" because it is the dataset every later step reads, not because it is Vietnam.
- **Runtime config instead of build-time env.** `MAP_HOST` is read from `/env-config.js` at runtime, not from a `VITE_*` variable, so one bundle serves any environment and the data location can change without a rebuild. `VITE_BASE_PATH` (the deploy sub-path) stays a build-time value.
- **Published files go straight into `apps/web/public/map`.** The CLI writes the boundary, wards and roads GeoJSON, tile folder (`tiles-roads-wards/`) and PMTiles archive (`hcmc-roads-wards.pmtiles`) there directly (no symlinks into `tmp/data`), and only intermediates stay in `tmp/data`. That folder is what the dev server serves and what gets uploaded to the data host.
- **Data is kept out of the bundle.** `apps/web/public/map` is gitignored; the data lives on a separate public host, which is why CORS, `Timing-Allow-Origin` and Range requirements apply.
- **MapLibre worker shipped as `.js`.** MapLibre 6 loads `maplibre-gl-worker.mjs` as a sibling of the script and the bundle drops it, so a Vite plugin emits it. It is emitted as `assets/maplibre-gl-worker.js` because the host serves `.mjs` as `application/octet-stream`, which browsers reject for module workers.
- **Folder tiles are uncompressed, PMTiles tiles are gzipped.** The folder is built with `--no-tile-compression` so any static host can serve it, and the host in front of it did not compress `.pbf`, so the 11 initial-view tiles cost 372,346 bytes on the wire, exactly their raw size. `check tiles` judges budgets on gzipped size (184 KB for the same view), which is what a compressing host would send. tippecanoe compresses tiles inside a PMTiles archive by default, so the archive is about 22.1 MB, close to the folder's gzipped total. That is why the same tiles are 372 KB as a folder and 207 KB as PM Tiles on the wire; keep that in mind when comparing bytes, it is a property of how each was built and served, not of the format. (Roads-only figures; with the wards in the tiles the same view is 402,849 B as a folder and 232,027 B as PM Tiles.)
- **`simple` extract strategy.** `complete_ways` was killed above about 3.3 GiB on whole-Vietnam highways; `simple` needs about 47 MiB. About 0.3% of the extracted ways never reach the GeoJSON, but mostly for another reason than the border (see [Border roads and the `simple` strategy](#border-roads-and-the-simple-strategy)).
- **Fixed benchmark box and pixel ratio.** The viewport decides how many tiles load and the pixel ratio decides drawing work, so both are pinned. Mode switches reload the page so no warm heap or reused worker leaks into a run. The map is torn down (`map.remove()`) before a reload, because repeated 80 MB GeoJSON loads in one tab otherwise grew the renderer's memory.
- **Dev server quirk.** Vite answers a missing file with `index.html` and status 200. In the normal (non-benchmark) view a missing tile can therefore be parsed as a tile and log an error; the benchmark protocol treats it as "missing".
- **Roads and wards are what is measured.** No points of interest. The city boundary is drawn in every mode but is not routed through the benchmark protocol, so it does not change the measured bytes; the wards are in the measured data (inside the tiles, and as a second GeoJSON file in GeoJSON mode) so that all three variants carry and draw the same content.

## Data and attribution

Map data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under the [ODbL](https://opendatacommons.org/licenses/odbl/). The extract comes from [Geofabrik](https://download.geofabrik.de/asia/vietnam.html) (snapshot `vietnam-260101`). The basemap is [OpenFreeMap](https://openfreemap.org/). The generated data is not part of this repository.
