<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { Map, NavigationControl } from "maplibre-gl";
import { BASEMAP_STYLE, BENCHMARK_MAP_HEIGHT, BENCHMARK_MAP_WIDTH, START_CENTER, START_ZOOM, type Mode, type TileMode } from "@/constants";
import { createBenchmark } from "@/lib/benchmark";
import { addRoadsLayer, addHCMCLayer, ROADS_SOURCE_ID } from "@/lib/map-layers";

const props = defineProps<{ mode: Mode; tileMode: TileMode; benchmark: boolean; record: boolean }>();
const emit = defineEmits<{ map: [map: Map]; ready: [] }>();

const mapSize = computed(() =>
  props.benchmark ? { width: `${BENCHMARK_MAP_WIDTH}px`, height: `${BENCHMARK_MAP_HEIGHT}px` } : { width: "100%", height: "100vh" },
);

let map: Map | null = null;
let benchmark: ReturnType<typeof createBenchmark> | null = null;

// The benchmark view changes the map box without recreating the map, so tell it to pick up the new size.
watch(
  () => props.benchmark,
  async () => {
    await nextTick();
    map?.resize();
  },
);

onMounted(() => {
  map = new Map({ container: "map", style: BASEMAP_STYLE, center: START_CENTER, zoom: START_ZOOM });

  map.addControl(new NavigationControl(), "top-right");
  emit("map", map);

  const created = map;
  benchmark = props.record ? createBenchmark(props.mode, created) : null;
  // Ready = the roads source is loaded and everything is rendered (the first such idle).
  const onIdle = () => {
    if (!created.getSource(ROADS_SOURCE_ID) || !created.isSourceLoaded(ROADS_SOURCE_ID)) return;
    created.off("idle", onIdle);
    emit("ready");
  };
  created.on("idle", onIdle);
  created.on("load", () => {
    try {
      addHCMCLayer(created);
      addRoadsLayer(created, props.mode, props.tileMode, benchmark?.toProtocolUrl);
    } catch (error) {
      benchmark?.fail(`could not add the layers: ${String(error)}`);
    }
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
