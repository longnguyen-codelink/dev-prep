<script setup lang="ts">
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { RoadsMode } from "@/lib/map-layers";

import RawGeoJsonView from "./views/RawGeoJson.vue";

const params = new URLSearchParams(window.location.search);
const mode: RoadsMode = params.get("mode") === "geojson" ? "geojson" : "tiles";
const isBenchmark = params.has("benchmark");

// A full page reload keeps every benchmark run a clean page load.
function reloadWith(update: (params: URLSearchParams) => void) {
  const url = new URL(window.location.href);
  update(url.searchParams);
  window.location.href = url.toString();
}

function switchMode(next: unknown) {
  if (next !== "tiles" && next !== "geojson") return;
  reloadWith((p) => p.set("mode", next));
}

function switchBenchmark(on: boolean) {
  reloadWith((p) => (on ? p.set("benchmark", "") : p.delete("benchmark")));
}
</script>

<template>
  <main class="relative h-full w-full">
    <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
      <div class="mx-auto flex w-1/3 justify-between rounded-lg bg-background p-2">
        <section class="flex items-center">
          <Select :model-value="mode" @update:model-value="switchMode">
            <SelectTrigger class="w-full max-w-30">
              <SelectValue placeholder="Data source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tiles">Tiles</SelectItem>
              <SelectItem value="geojson">GeoJSON</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <section class="flex items-center">
          <div class="flex items-center">
            <Label for="benchmark-switch" class="mr-2">Benchmark</Label>
            <Switch id="benchmark-switch" :model-value="isBenchmark" @update:model-value="switchBenchmark" />
          </div>
        </section>
      </div>
    </div>

    <!-- MapView -->
    <RawGeoJsonView :mode="mode" :benchmark="isBenchmark" />
  </main>
</template>
