<script setup lang="ts">
import { computed } from "vue";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LAYER_ENTRIES, type LayerGroup } from "@/constants";
import { entryColors } from "@/lib/map-layers";

const { layers } = defineProps<{ layers: readonly LayerGroup[] }>();

// One badge per drawn layer of the selected groups, with the colour(s) the map draws it in.
const entries = computed(() =>
  LAYER_ENTRIES.filter((entry) => layers.includes(entry.group)).map((entry) => ({
    key: entry.key,
    label: entry.label,
    swatch: swatchOf(entryColors(entry.key)),
  })),
);

// A single colour, or equal bands of all of them (a ward's fill is one of five colours).
function swatchOf(colors: string[]): string {
  if (colors.length === 1) return colors[0]!;
  const band = 100 / colors.length;
  return `linear-gradient(90deg, ${colors.map((color, index) => `${color} ${index * band}% ${(index + 1) * band}%`).join(", ")})`;
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Label>Active layers</Label>
    <Badge v-for="entry in entries" :key="entry.key" variant="outline">
      <span class="size-2.5 rounded-full border border-foreground/20" :style="{ background: entry.swatch }" aria-hidden="true"></span>
      {{ entry.label }}
    </Badge>
    <span v-if="entries.length === 0" class="text-xs text-muted-foreground">None</span>
  </div>
</template>
