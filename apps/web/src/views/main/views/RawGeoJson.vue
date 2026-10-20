<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from "vue";
import { Map, NavigationControl } from "maplibre-gl";
import {
  BASEMAP_STYLE,
  BENCHMARK_MAP_HEIGHT,
  BENCHMARK_MAP_WIDTH,
  START_CENTER,
  START_ZOOM,
} from "@/constants";
import { createBenchmark } from "@/lib/benchmark";
import { addRoadsLayer, type RoadsMode } from "@/lib/map-layers";

const props = defineProps<{ mode: RoadsMode; benchmark: boolean; record: boolean }>();
const emit = defineEmits<{ map: [map: Map] }>();

const mapSize = computed(() =>
  props.benchmark
    ? { width: `${BENCHMARK_MAP_WIDTH}px`, height: `${BENCHMARK_MAP_HEIGHT}px` }
    : { width: "100%", height: "100vh" },
);

let map: Map | null = null;

// The benchmark view changes the map box without recreating the map, so tell it to pick up the new size.
watch(
  () => props.benchmark,
  async () => {
    await nextTick();
    map?.resize();
  },
);

onMounted(() => {
  const benchmark = props.record ? createBenchmark(props.mode) : null;

  map = new Map({
    container: "map",
    style: BASEMAP_STYLE,
    center: START_CENTER,
    zoom: START_ZOOM,
  });

  map.addControl(new NavigationControl(), "top-right");
  emit("map", map);

  const created = map;
  created.on("load", () => {
    addRoadsLayer(created, props.mode, benchmark?.toProtocolUrl);
    void benchmark?.run(created);
  });
});
</script>

<template>
  <div id="map" class="shrink-0" :style="mapSize"></div>
</template>
