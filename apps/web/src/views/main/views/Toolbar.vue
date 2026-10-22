<script setup lang="ts">
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MODES, type Mode, type TileMode } from "@/constants";

import { SelectMode } from "../components/select-mode";
import { SelectTileMode } from "../components/select-tilemode";

defineProps<{ mode: Mode; tileMode: TileMode; isBenchmark: boolean; busy: boolean }>();
const emit = defineEmits<{ switchMode: [mode: Mode]; switchTileMode: [tileMode: TileMode]; switchBenchmark: [on: boolean] }>();
</script>

<template>
  <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
    <div class="mx-auto flex w-160 justify-between rounded-lg bg-background p-2">
      <section class="flex items-center gap-4">
        <SelectMode :mode="mode" :busy="busy" :switchMode="(next) => emit('switchMode', next)" />
        <SelectTileMode :mode="tileMode" :busy="busy" :switchMode="(next) => emit('switchTileMode', next)" :isHidden="mode != MODES.TILES" />
      </section>

      <section class="flex items-center">
        <div class="flex flex-col gap-2">
          <Label for="benchmark-switch">Benchmark</Label>
          <div class="flex h-9 items-center">
            <Switch id="benchmark-switch" :model-value="isBenchmark" :disabled="busy" @update:model-value="(on) => emit('switchBenchmark', Boolean(on))" />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
