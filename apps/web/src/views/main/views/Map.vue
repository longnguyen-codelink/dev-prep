<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { Map, NavigationControl } from "maplibre-gl";
import { BASEMAP_STYLE, BENCHMARK_MAP_HEIGHT, BENCHMARK_MAP_WIDTH, START_CENTER, START_ZOOM } from "@/constants";
import { createBenchmark } from "@/lib/benchmark";
import { addRoadsLayer, addHCMCLayer, type RoadsMode } from "@/lib/map-layers";

const props = defineProps<{ mode: RoadsMode; benchmark: boolean; record: boolean }>();
const emit = defineEmits<{ map: [map: Map] }>();

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
  created.on("load", () => {
    try {
      addHCMCLayer(created);
      addRoadsLayer(created, props.mode, benchmark?.toProtocolUrl);
    } catch (error) {
      benchmark?.fail(`could not add the layers: ${String(error)}`);
    }
  });
});

onBeforeUnmount(() => {
  benchmark?.dispose();
  map?.remove();
});
</script>

<template>
  <div id="map" class="shrink-0" :style="mapSize"></div>
</template>
