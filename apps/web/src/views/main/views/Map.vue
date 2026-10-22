<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { Map, NavigationControl, setWorkerUrl } from "maplibre-gl";
import {
  BASEMAP_STYLE,
  BENCHMARK_MAP_HEIGHT,
  BENCHMARK_MAP_WIDTH,
  BENCHMARK_PIXEL_RATIO,
  LAYER_GROUPS,
  START_CENTER,
  START_ZOOM,
  type LayerGroup,
  type Mode,
  type TileMode,
} from "@/constants";
import { createBenchmark } from "@/lib/benchmark";
import { addRoadsLayer, addHCMCLayer, addWardsLayer, removeWardsLayer, ROADS_SOURCE_ID, WARDS_SOURCE_ID } from "@/lib/map-layers";
import { applyVisibility, tryCatchSync } from "@/lib/utils";

// The production bundle drops MapLibre's sibling worker file; the plugin in vite.config.ts ships it as a .js file.
if (import.meta.env.PROD) setWorkerUrl(`${import.meta.env.BASE_URL}assets/maplibre-gl-worker.js`);

const {
  mode,
  tileMode,
  record,
  layers,
  benchmark: isBenchmark,
} = defineProps<{ mode: Mode; tileMode: TileMode; benchmark: boolean; record: boolean; layers: readonly LayerGroup[] }>();
const emit = defineEmits<{ map: [map: Map]; ready: []; wardsError: [] }>();

const mapSize = computed(() =>
  isBenchmark ? { width: `${BENCHMARK_MAP_WIDTH}px`, height: `${BENCHMARK_MAP_HEIGHT}px` } : { width: "100%", height: "100vh" },
);

let map: Map | null = null;
let layersAdded = false;
let wardsAdded = false;
let benchmark: ReturnType<typeof createBenchmark> | null = null;

// The benchmark view changes the map box without recreating the map, so tell it to pick up the new size.
watch(
  () => benchmark,
  async () => {
    await nextTick();
    map?.setPixelRatio(isBenchmark ? BENCHMARK_PIXEL_RATIO : window.devicePixelRatio);
    map?.resize();
  },
);

// Draws the selected groups. The ward data is only requested the first time Wards is selected, and never in the
// benchmark view, so a benchmark run never fetches it.
function syncLayers() {
  if (!map || !layersAdded) return;
  if (layers.includes(LAYER_GROUPS.WARDS) && !isBenchmark && !wardsAdded) {
    addWardsLayer(map);
    wardsAdded = true;
  }
  applyVisibility(map, layers);
}

// The layers select changes which groups are drawn; before the layers exist, the load handler applies the selection.
watch(() => layers, syncLayers);

onMounted(() => {
  map = new Map({
    container: "map",
    style: BASEMAP_STYLE,
    center: START_CENTER,
    zoom: START_ZOOM,
    pixelRatio: isBenchmark ? BENCHMARK_PIXEL_RATIO : undefined,
  });

  map.addControl(new NavigationControl(), "top-right");
  emit("map", map);

  const created = map;
  benchmark = record ? createBenchmark(mode, tileMode, created) : null;
  // Ready = the roads source is loaded and everything is rendered (the first such idle).
  const onIdle = () => {
    if (!created.getSource(ROADS_SOURCE_ID) || !created.isSourceLoaded(ROADS_SOURCE_ID)) return;
    created.off("idle", onIdle);
    emit("ready");
  };
  created.on("idle", onIdle);
  // A ward file that cannot be loaded (e.g. not uploaded to the data host yet) is taken out again, so selecting Wards retries.
  created.on("error", (event) => {
    if ((event as { sourceId?: string }).sourceId !== WARDS_SOURCE_ID) return;
    removeWardsLayer(created);
    wardsAdded = false;
    emit("wardsError");
  });
  created.on("load", () => {
    const { error } = tryCatchSync(() => {
      addHCMCLayer(created);
      addRoadsLayer(created, mode, tileMode, benchmark?.toProtocolUrl, benchmark?.toPmtilesSource);
      layersAdded = true;
      syncLayers();
    });

    if (error) benchmark?.fail(`could not add the layers: ${String(error)}`);
  });
});

// Frees the map's worker (which holds the parsed GeoJSON) and GL context right away, so repeated heavy loads in the
// same tab do not pile up memory; called before the page navigates away and when it is hidden.
function teardown() {
  benchmark?.dispose();
  benchmark = null;
  map?.remove();
  map = null;
}
defineExpose({ teardown });

// A page restored from the back/forward cache has no map any more; load it fresh instead.
const onPageShow = (event: PageTransitionEvent) => {
  if (event.persisted) window.location.reload();
};
window.addEventListener("pagehide", teardown);
window.addEventListener("pageshow", onPageShow);

onBeforeUnmount(() => {
  window.removeEventListener("pagehide", teardown);
  window.removeEventListener("pageshow", onPageShow);
  teardown();
});
</script>

<template>
  <div id="map" class="shrink-0" :style="mapSize"></div>
</template>
