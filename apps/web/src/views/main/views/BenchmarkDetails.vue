<script setup lang="ts">
import { computed } from "vue";

import { BASEMAP_STYLE, BENCHMARK_MAP_HEIGHT, BENCHMARK_MAP_WIDTH, START_ZOOM, MODES, TILE_MODES, type Mode, type TileMode } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { formatBytes, formatMs, loadRuns, runsVersion, summarize, type MapSpec } from "@/lib/benchmark";

const props = defineProps<{ mode: Mode; tileMode: TileMode; spec: MapSpec }>();
const { live, win, sizeOk, startCenter } = props.spec;

const other = computed<Mode>(() => (props.mode === MODES.TILES ? MODES.GEOJSON : MODES.TILES));

const source = computed(() => {
  if (props.mode !== MODES.TILES) return `GeoJSON, ${MAP_URLS.roadsGeoJson}`;
  return props.tileMode === TILE_MODES.PM_TILES ? `${TILE_MODES.PM_TILES}, ${MAP_URLS.roadPmtiles}` : `vector tiles (folder), ${MAP_URLS.roadTiles}`;
});

function runsOf(mode: Mode) {
  void runsVersion.value;
  return loadRuns(mode);
}
const current = computed(() => summarize(runsOf(props.mode)));
const otherSummary = computed(() => summarize(runsOf(other.value)));

// How the other mode compares, on medians of ok runs; the ratio is "this mode over the other".
const comparison = computed(() => {
  const a = current.value;
  const b = otherSummary.value;
  const rows = [
    { name: "Ready", a: formatMs(a.readyMs), b: formatMs(b.readyMs), ratio: ratio(a.readyMs, b.readyMs) },
    { name: "Bytes", a: formatBytes(a.bytes), b: formatBytes(b.bytes), ratio: ratio(a.bytes, b.bytes) },
    { name: "Requests", a: String(a.requests ?? "-"), b: String(b.requests ?? "-"), ratio: ratio(a.requests, b.requests) },
  ];
  return { ready: a.okRuns > 0 && b.okRuns > 0, rows };
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
        <dd>{{ win.width }} x {{ win.height }}, pixel ratio {{ win.ratio }}</dd>
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
      <h3 class="text-sm font-semibold">{{ mode }} vs {{ other }}</h3>
      <p v-if="!comparison.ready" class="text-muted-foreground">
        Record at least one ok run in each mode to compare (switch mode, then press Run a few times).
      </p>
      <table v-else class="w-full">
        <thead>
          <tr class="text-left text-muted-foreground">
            <th></th>
            <th>{{ mode }}</th>
            <th>{{ other }}</th>
            <th>{{ mode }} vs {{ other }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in comparison.rows" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.a }}</td>
            <td>{{ row.b }}</td>
            <td>{{ row.ratio }}</td>
          </tr>
        </tbody>
      </table>
      <p class="text-muted-foreground">
        Medians of ok runs. GeoJSON is parsed on the main thread in benchmark mode, which adds to its after-download time.
      </p>
    </div>
  </section>
</template>
