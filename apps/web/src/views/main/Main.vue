<script setup lang="ts">
import { ChipBuildVersion } from "./components/chip-build-version";

import type { Map } from "maplibre-gl";
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { cn } from "cn";

import {
  BENCHMARK_MAP_WIDTH,
  BENCHMARK_RECORD_PARAM,
  BENCHMARK_VIEW_PARAM,
  MAP_READY_TIMEOUT_MS,
  MODES,
  type Mode,
  type TileMode,
  TILE_MODES,
} from "@/constants";
import { runsVersion, useMapSpec } from "@/lib/benchmark";

import BenchmarkDetails from "./views/BenchmarkDetails.vue";
import BenchmarkPanel from "./views/BenchmarkPanel.vue";
import MapView from "./views/Map.vue";
import Toolbar from "./views/Toolbar.vue";

const params = new URLSearchParams(window.location.search);
// Case-insensitive so old links (?mode=geojson, ?mode=tiles) still work; anything else means Tiles.
const modeParam = params.get("mode")?.toLowerCase();
const mode: Mode = modeParam === MODES.GEOJSON.toLowerCase() ? MODES.GEOJSON : MODES.TILES;
const isBenchmark = ref(params.has(BENCHMARK_VIEW_PARAM));
const tileModeParam = params.get("tileMode")?.toLowerCase();
const tileMode: TileMode = tileModeParam === TILE_MODES.PM_TILES.toLowerCase() ? TILE_MODES.PM_TILES : TILE_MODES.FOLDER;

// ?run makes this page load record one run; drop it so a manual reload only shows the view.
const record = isBenchmark.value && params.has(BENCHMARK_RECORD_PARAM);
if (params.has(BENCHMARK_RECORD_PARAM)) {
  const url = new URL(window.location.href);
  url.searchParams.delete(BENCHMARK_RECORD_PARAM);
  window.history.replaceState(null, "", url);
}

const running = ref(record);
watch(runsVersion, () => (running.value = false));
const map = shallowRef<Map | null>(null);
const mapView = ref<InstanceType<typeof MapView> | null>(null);
const spec = useMapSpec(map);

// The toolbar is disabled while the map loads and renders, and from the moment a mode switch starts until the reload.
const ready = ref(false);
const switching = ref(false);
const busy = computed(() => !ready.value || switching.value);
const readyTimer = setTimeout(() => (ready.value = true), MAP_READY_TIMEOUT_MS);
watch(ready, (value) => value && clearTimeout(readyTimer));
onBeforeUnmount(() => clearTimeout(readyTimer));

// A full page reload keeps every benchmark run a clean page load.
function reloadWith(update: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href);
  update(url.searchParams);
  mapView.value?.teardown(); // free the map's memory before the next heavy load starts
  window.location.href = url.toString();
}

function switchMode(next: Mode) {
  if (next === mode) return;
  switching.value = true;
  reloadWith((p) => p.set("mode", next));
}

function switchTileMode(next: TileMode) {
  if (next === tileMode) return;
  switching.value = true;
  reloadWith((p) => p.set("tileMode", next));
}

// Opening the benchmark view does not reload the page; the URL is kept in sync so F5 restores the view.
function switchBenchmark(on: boolean) {
  isBenchmark.value = on;
  const url = new URL(window.location.href);
  if (on) url.searchParams.set(BENCHMARK_VIEW_PARAM, "");
  else url.searchParams.delete(BENCHMARK_VIEW_PARAM);
  window.history.replaceState(null, "", url);
}

// Each run is a clean page load: reload with ?run so this load records one run.
function startRun() {
  switching.value = true;
  reloadWith((p) => p.set(BENCHMARK_RECORD_PARAM, ""));
}
</script>

<template>
  <main class="relative flex h-full w-full">
    <!-- MapView -->
    <div
      :class="cn('relative flex flex-col', isBenchmark ? 'shrink-0' : 'w-full')"
      :style="isBenchmark ? { width: `${BENCHMARK_MAP_WIDTH}px` } : undefined"
    >
      <Toolbar
        :mode="mode"
        :tileMode="tileMode"
        :isBenchmark="isBenchmark"
        :busy="busy"
        @switchMode="switchMode"
        @switchTileMode="switchTileMode"
        @switchBenchmark="switchBenchmark"
      />

      <MapView
        ref="mapView"
        :mode="mode"
        :tileMode="tileMode"
        :benchmark="isBenchmark"
        :record="record"
        @map="(m) => (map = m)"
        @ready="ready = true"
      />
      <BenchmarkDetails v-if="isBenchmark" :mode="mode" :tileMode="tileMode" :spec="spec" />
    </div>
    <BenchmarkPanel v-if="isBenchmark" :mode="mode" :tileMode="tileMode" :spec="spec" :running="running" :busy="busy" @run="startRun" />
  </main>
  <ChipBuildVersion />
</template>
