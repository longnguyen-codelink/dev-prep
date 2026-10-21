<script setup lang="ts">
import type { Props } from "./lib/types";

import { MODES } from "@/constants";
import { LoaderCircle } from "@lucide/vue";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const { mode, busy, switchMode } = defineProps<Props>();

function onSelect(value: unknown) {
  if (value === MODES.TILES || value === MODES.GEOJSON) switchMode(value);
}
</script>

<template>
  <Select :model-value="mode" :disabled="busy" @update:model-value="onSelect">
    <SelectTrigger class="flex w-full max-w-45 items-center gap-2">
      <LoaderCircle v-if="busy" class="ml-2 size-4 animate-spin text-muted-foreground" aria-label="Loading" />
      <SelectValue placeholder="Data source" />
    </SelectTrigger>
    <SelectContent>
      <template v-for="mode in Object.entries(MODES)" :key="mode[0]">
        <SelectItem :value="mode[1]">
          {{ mode[1] }}
        </SelectItem>
      </template>
    </SelectContent>
  </Select>
</template>
