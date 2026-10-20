<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { Map } from "maplibre-gl";
import { LoaderCircle } from "@lucide/vue";
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";

import { BENCHMARK_MAP_WIDTH, BENCHMARK_RECORD_PARAM, BENCHMARK_VIEW_PARAM, MAP_READY_TIMEOUT_MS } from "@/constants";
import { runsVersion, useMapSpec } from "@/lib/benchmark";
import type { RoadsMode } from "@/lib/map-layers";

import BenchmarkDetails from "./views/BenchmarkDetails.vue";
import BenchmarkPanel from "./views/BenchmarkPanel.vue";
import MapView from "./views/Map.vue";

const params = new URLSearchParams(window.location.search);
const mode: RoadsMode = params.get("mode") === "geojson" ? "geojson" : "tiles";
const isBenchmark = ref(params.has(BENCHMARK_VIEW_PARAM));
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

function switchMode(next: unknown) {
  if (next !== "tiles" && next !== "geojson") return;
  if (next === mode) return;
  switching.value = true;
  reloadWith((p) => p.set("mode", next));
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
      class="relative flex flex-col"
      :class="isBenchmark ? 'shrink-0' : 'w-full'"
      :style="isBenchmark ? { width: `${BENCHMARK_MAP_WIDTH}px` } : undefined"
    >
      <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
        <div class="mx-auto flex w-1/3 justify-between rounded-lg bg-background p-2">
          <section class="flex items-center">
            <Select :model-value="mode" :disabled="busy" @update:model-value="switchMode">
              <SelectTrigger class="w-full max-w-30">
                <SelectValue placeholder="Data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tiles">Tiles</SelectItem>
                <SelectItem value="geojson">GeoJSON</SelectItem>
              </SelectContent>
            </Select>
            <LoaderCircle v-if="busy" class="ml-2 size-4 animate-spin text-muted-foreground" aria-label="Loading" />
          </section>

          <section class="flex items-center">
            <div class="flex items-center">
              <Label for="benchmark-switch" class="mr-2">Benchmark</Label>
              <Switch id="benchmark-switch" :model-value="isBenchmark" :disabled="busy" @update:model-value="switchBenchmark" />
            </div>
          </section>
        </div>
      </div>

      <MapView ref="mapView" :mode="mode" :benchmark="isBenchmark" :record="record" @map="(m) => (map = m)" @ready="ready = true" />
      <BenchmarkDetails v-if="isBenchmark" :mode="mode" :spec="spec" />
    </div>
    <BenchmarkPanel v-if="isBenchmark" :mode="mode" :spec="spec" :running="running" :busy="busy" @run="startRun" />
  </main>
</template>
