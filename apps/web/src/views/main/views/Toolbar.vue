<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { type LayerGroup, MODES, type Mode, type TileMode } from "@/constants";

import { ActiveLayers } from "../components/active-layers";
import { SelectLayers } from "../components/select-layers";
import { SelectMode } from "../components/select-mode";
import { SelectTileMode } from "../components/select-tilemode";

defineProps<{ mode: Mode; tileMode: TileMode; layers: readonly LayerGroup[]; zoom: number; isBenchmark: boolean; busy: boolean }>();
const emit = defineEmits<{
  switchMode: [mode: Mode];
  switchTileMode: [tileMode: TileMode];
  switchLayers: [layers: LayerGroup[]];
  switchBenchmark: [on: boolean];
}>();
</script>

<template>
  <div id="toolbar" class="absolute top-5 left-1/3 z-10 min-h-12 rounded-lg bg-background p-3">
    <div class="mx-auto mb-3 flex w-160 justify-between">
      <section class="flex items-center gap-4">
        <SelectMode :mode="mode" :busy="busy" :switchMode="(next) => emit('switchMode', next)" />
        <SelectTileMode :mode="tileMode" :busy="busy" :switchMode="(next) => emit('switchTileMode', next)" :isHidden="mode != MODES.TILES" />
        <!-- Not in the benchmark view: every benchmark run draws the default layers. -->
        <SelectLayers v-if="!isBenchmark" :layers="layers" :switchLayers="(next) => emit('switchLayers', next)" />
      </section>

      <section class="flex items-center gap-4">
        <div class="flex flex-col gap-2">
          <Label for="benchmark-switch">Benchmark</Label>
          <div class="flex h-9 items-center">
            <Switch
              id="benchmark-switch"
              :model-value="isBenchmark"
              :disabled="busy"
              @update:model-value="(on) => emit('switchBenchmark', Boolean(on))"
            />
          </div>
        </div>
      </section>
    </div>

    <ActiveLayers :layers="layers" :zoom="zoom" />
  </div>
</template>
