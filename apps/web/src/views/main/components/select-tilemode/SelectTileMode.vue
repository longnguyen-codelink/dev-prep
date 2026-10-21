<script setup lang="ts">
import type { Props } from "./lib/types";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TILE_MODES } from "@/constants";

const { mode, busy, switchMode, isDisabled } = defineProps<Props>();

function onSelect(value: unknown) {
  if (value === TILE_MODES.FOLDER || value === TILE_MODES.PM_TILES) switchMode(value);
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <Label for="tilemode">Tile mode</Label>
    <Select id="tilemode" :model-value="mode" :disabled="busy || isDisabled" @update:model-value="onSelect">
      <SelectTrigger class="flex w-full max-w-45 items-center gap-2">
        <SelectValue placeholder="Tile mode" />
      </SelectTrigger>
      <SelectContent>
        <template v-for="mode in Object.entries(TILE_MODES)" :key="mode[0]">
          <SelectItem :value="mode[1]">
            {{ mode[1] }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </section>
</template>
