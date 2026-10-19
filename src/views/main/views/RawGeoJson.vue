<script setup lang="ts">
import { onMounted } from "vue";
import { Map, NavigationControl } from "maplibre-gl";
import { BASEMAP_STYLE, START_CENTER, START_ZOOM } from "@/constants";

onMounted(() => {
  const map = new Map({
    container: "map",
    style: BASEMAP_STYLE,
    center: START_CENTER,
    zoom: START_ZOOM,
  });

  map.addControl(new NavigationControl(), "top-right");

  console.log("RawGeoJson component mounted");
});
</script>

<template>
  <div id="map" style="width: 100%; height: 100vh"></div>
</template>
