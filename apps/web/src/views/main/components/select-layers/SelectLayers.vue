<script setup lang="ts">
import type { Props } from "./lib/types";

import { computed } from "vue";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAYER_GROUP_LABELS, LAYER_GROUPS, type LayerGroup } from "@/constants";

const { layers, switchLayers } = defineProps<Props>();

const groups = Object.values(LAYER_GROUPS);
const summary = computed(() =>
  layers.length > 0
    ? groups
        .filter((group) => layers.includes(group))
        .map((group) => LAYER_GROUP_LABELS[group])
        .join(", ")
    : "None",
);

const onSelect = (value: unknown) => Array.isArray(value) && switchLayers(value as LayerGroup[]);
</script>

<template>
  <section class="flex flex-col gap-2">
    <Label for="layers">Layers</Label>
    <Select id="layers" multiple :model-value="[...layers]" @update:model-value="onSelect">
      <SelectTrigger class="flex w-70 items-center gap-2">
        <SelectValue placeholder="Layers">{{ summary }}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="group in groups" :key="group" :value="group">
          {{ LAYER_GROUP_LABELS[group] }}
        </SelectItem>
      </SelectContent>
    </Select>
  </section>
</template>
