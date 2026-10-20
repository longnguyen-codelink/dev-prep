<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { RoadsMode } from "@/lib/map-layers";

import RawGeoJsonView from "./views/RawGeoJson.vue";

const params = new URLSearchParams(window.location.search);
const mode: RoadsMode = params.get("mode") === "tiles" ? "tiles" : "geojson";
const isBenchmark = params.has("benchmark");

// A full page reload keeps every benchmark run a clean page load.
function switchMode(next: RoadsMode) {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", next);
  window.location.href = url.toString();
}
</script>

<template>
  <main class="relative h-full w-full">
    <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
      <div class="mx-auto flex w-1/3 gap-2 rounded-lg bg-background p-2">
        <Button
          class="flex-1"
          :variant="mode === 'tiles' ? 'default' : 'outline'"
          @click="switchMode('tiles')"
        >
          Tiles
        </Button>
        <Button
          class="flex-1"
          :variant="mode === 'geojson' ? 'default' : 'outline'"
          @click="switchMode('geojson')"
        >
          GeoJSON
        </Button>
      </div>
    </div>

    <!-- MapView -->
    <RawGeoJsonView :mode="mode" :benchmark="isBenchmark" />
  </main>
</template>
