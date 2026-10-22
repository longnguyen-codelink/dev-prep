<script setup lang="ts">
import type { Props } from "./lib/types";

import { MODES } from "@/constants";
import { LoaderCircle } from "@lucide/vue";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const { mode, busy, switchMode } = defineProps<Props>();

function onSelect(value: unknown) {
  if (value === MODES.TILES || value === MODES.GEOJSON) switchMode(value);
}
</script>

<template>
  <section class="flex flex-col gap-2">
    <Label for="datasource">Data source</Label>
    <Select id="datasource" :model-value="mode" :disabled="busy" @update:model-value="onSelect">
      <SelectTrigger class="flex w-full max-w-45 min-w-30 items-center gap-1">
        <LoaderCircle v-if="busy" class="size-4 animate-spin text-muted-foreground" aria-label="Loading" />
        <SelectValue placeholder="Data source" />
      </SelectTrigger>
      <SelectContent>
        <template v-for="[key, value] in Object.entries(MODES)" :key="key">
          <SelectItem :value="value">
            {{ value }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </section>
</template>
