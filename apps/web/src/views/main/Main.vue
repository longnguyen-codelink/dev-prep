<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RoadsMode } from "@/lib/map-layers";

import RawGeoJsonView from "./views/RawGeoJson.vue";

const params = new URLSearchParams(window.location.search);
const mode: RoadsMode = params.get("mode") === "geojson" ? "geojson" : "tiles";
const isBenchmark = params.has("benchmark");

// A full page reload keeps every benchmark run a clean page load.
function switchMode(next: unknown) {
  if (next !== "tiles" && next !== "geojson") return;
  const url = new URL(window.location.href);
  url.searchParams.set("mode", next);
  window.location.href = url.toString();
}
</script>

<template>
  <main class="relative h-full w-full">
    <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
      <div class="mx-auto w-1/3 rounded-lg bg-background p-2">
        <Select :model-value="mode" @update:model-value="switchMode">
          <SelectTrigger class="w-full max-w-30">
            <SelectValue placeholder="Data source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tiles">Tiles</SelectItem>
            <SelectItem value="geojson">GeoJSON</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- MapView -->
    <RawGeoJsonView :mode="mode" :benchmark="isBenchmark" />
  </main>
</template>
