<script setup lang="ts">
import { computed, onMounted } from "vue";
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

const props = defineProps<{ mode: RoadsMode; benchmark: boolean }>();

const mapSize = computed(() =>
  props.benchmark
    ? { width: `${BENCHMARK_MAP_WIDTH}px`, height: `${BENCHMARK_MAP_HEIGHT}px` }
    : { width: "100%", height: "100vh" },
);

onMounted(() => {
  const benchmark = props.benchmark ? createBenchmark(props.mode) : null;

  const map = new Map({
    container: "map",
    style: BASEMAP_STYLE,
    center: START_CENTER,
    zoom: START_ZOOM,
  });

  map.addControl(new NavigationControl(), "top-right");

  map.on("load", () => {
    addRoadsLayer(map, props.mode, benchmark?.toProtocolUrl);
    void benchmark?.run(map);
  });

});
</script>

<template>
  <div id="map" :style="mapSize"></div>
</template>
