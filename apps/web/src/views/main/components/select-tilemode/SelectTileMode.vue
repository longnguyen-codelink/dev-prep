<script setup lang="ts">
import type { Props } from "./lib/types";

import { cn } from "cn";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TILE_MODES } from "@/constants";

const { mode, busy, isHidden, switchMode } = defineProps<Props>();
const onSelect = (value: unknown) => (value === TILE_MODES.FOLDER || value === TILE_MODES.PM_TILES) && switchMode(value);
</script>

<template>
  <section :class="cn('flex flex-col gap-2', isHidden && 'hidden')">
    <Label for="tilemode">Tile mode</Label>
    <Select id="tilemode" :model-value="mode" :disabled="busy" @update:model-value="onSelect">
      <SelectTrigger class="flex w-full max-w-45 items-center gap-2">
        <SelectValue placeholder="Tile mode" />
      </SelectTrigger>
      <SelectContent>
        <template v-for="[key, value] in Object.entries(TILE_MODES)" :key="key">
          <SelectItem :value="value">
            {{ value }}
          </SelectItem>
        </template>
      </SelectContent>
    </Select>
  </section>
</template>
