<script setup lang="ts">
import { computed } from "vue";

import {
  BASEMAP_STYLE,
  BENCHMARK_MAP_HEIGHT,
  BENCHMARK_MAP_WIDTH,
  BENCHMARK_PIXEL_RATIO,
  START_ZOOM,
  MODES,
  TILE_MODES,
  type Mode,
  type TileMode,
  VARIANTS,
  type Variant,
} from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { formatBytes, formatMs, loadRuns, runsVersion, summarize, type MapSpec } from "@/lib/benchmark";

const props = defineProps<{ mode: Mode; tileMode: TileMode; spec: MapSpec }>();
const { live, win, sizeOk, startCenter } = props.spec;

const source = computed(() => {
  if (props.mode !== MODES.TILES) return `GeoJSON, ${MAP_URLS.roadsGeoJson} and ${MAP_URLS.wardsGeoJson}`;
  return props.tileMode === TILE_MODES.PM_TILES
    ? `${TILE_MODES.PM_TILES}, ${MAP_URLS.pmtiles} (roads + wards)`
    : `vector tiles (folder), ${MAP_URLS.tiles} (roads + wards)`;
});

function runsOf(variant: Variant) {
  void runsVersion.value;
  return loadRuns(variant);
}
const geojson = computed(() => summarize(runsOf(VARIANTS.GEOJSON)));
const folder = computed(() => summarize(runsOf(VARIANTS.FOLDER)));
const pmtiles = computed(() => summarize(runsOf(VARIANTS.PM_TILES)));

// Medians of ok runs per variant; the ratios are "tile variant over GeoJSON".
const comparison = computed(() => {
  const [g, f, p] = [geojson.value, folder.value, pmtiles.value];
  const rows = [
    {
      name: "Ready",
      g: formatMs(g.readyMs),
      f: formatMs(f.readyMs),
      p: formatMs(p.readyMs),
      fRatio: ratio(f.readyMs, g.readyMs),
      pRatio: ratio(p.readyMs, g.readyMs),
    },
    {
      name: "Bytes",
      g: formatBytes(g.bytes),
      f: formatBytes(f.bytes),
      p: formatBytes(p.bytes),
      fRatio: ratio(f.bytes, g.bytes),
      pRatio: ratio(p.bytes, g.bytes),
    },
    {
      name: "Requests",
      g: String(g.requests ?? "-"),
      f: String(f.requests ?? "-"),
      p: String(p.requests ?? "-"),
      fRatio: ratio(f.requests, g.requests),
      pRatio: ratio(p.requests, g.requests),
    },
  ];
  const variantsWithRuns = [g, f, p].filter((s) => s.okRuns > 0).length;
  return { ready: variantsWithRuns >= 2, rows };
});
function ratio(a: number | null, b: number | null): string {
  if (a === null || b === null || a === 0 || b === 0) return "-";
  const value = a / b;
  return value >= 1 ? `${value.toFixed(1)}x more` : `${(1 / value).toFixed(1)}x less`;
}
</script>

<template>
  <section class="grid grid-cols-1 gap-4 p-3 text-xs md:grid-cols-2">
    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Map specification</h3>
      <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
        <dt class="text-muted-foreground">Map size</dt>
        <dd :class="{ 'text-destructive': live.width > 0 && !sizeOk }">
          {{ live.width }} x {{ live.height }} (target {{ BENCHMARK_MAP_WIDTH }} x {{ BENCHMARK_MAP_HEIGHT }})
        </dd>
        <dt class="text-muted-foreground">Window</dt>
        <dd>{{ win.width }} x {{ win.height }}, pixel ratio {{ win.ratio }} (map drawn at {{ BENCHMARK_PIXEL_RATIO }})</dd>
        <dt class="text-muted-foreground">View</dt>
        <dd>zoom {{ live.zoom.toFixed(2) }}, center {{ live.center }}</dd>
        <dt class="text-muted-foreground">Start view</dt>
        <dd>zoom {{ START_ZOOM }}, center {{ startCenter.join(", ") }}</dd>
        <dt class="text-muted-foreground">Basemap</dt>
        <dd class="break-all">{{ BASEMAP_STYLE }} ({{ live.basemapLayers }} layers)</dd>
        <dt class="text-muted-foreground">Overlay source</dt>
        <dd class="break-all">{{ source }}</dd>
        <dt class="text-muted-foreground">Overlay layers</dt>
        <dd>{{ live.overlayLayers.join(", ") || "-" }}</dd>
      </dl>
    </div>

    <div class="space-y-3">
      <h3 class="text-sm font-semibold">Comparison</h3>
      <p v-if="!comparison.ready" class="text-muted-foreground">
        Record at least one ok run in two of the three variants to compare (switch mode or tile mode, then press Run a few times).
      </p>
      <table v-else class="w-full">
        <thead>
          <tr class="text-left text-muted-foreground">
            <th></th>
            <th>GeoJSON</th>
            <th>Tiles (Folder)</th>
            <th>Tiles (PM Tiles)</th>
            <th>Folder vs GeoJSON</th>
            <th>PM Tiles vs GeoJSON</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparison.rows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.g }}</td>
            <td>{{ row.f }}</td>
            <td>{{ row.p }}</td>
            <td>{{ row.fRatio }}</td>
            <td>{{ row.pRatio }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-muted-foreground">
        Medians of ok runs. GeoJSON is parsed on the main thread in benchmark mode, which adds to its after-download time.
      </p>
    </div>
  </section>
</template>
