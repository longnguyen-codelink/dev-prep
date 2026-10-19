<script setup lang="ts">
import { ref } from "vue";
import { Button } from "@/components/ui/button";

import RawGeoJsonView from "./views/RawGeoJson.vue";

const isRenderRawMap = ref(true);
</script>

<template>
  <main class="relative h-full w-full">
    <div id="toolbar" class="absolute top-5 left-0 z-10 min-h-12 w-full">
      <div class="mx-auto w-1/3 rounded-lg bg-background p-2">
        <Button @click="isRenderRawMap = !isRenderRawMap"> Toggle Map </Button>
      </div>
    </div>

    <!-- MapView -->
    <RawGeoJsonView v-if="isRenderRawMap" />
    <div v-else>Main View</div>
  </main>
</template>
