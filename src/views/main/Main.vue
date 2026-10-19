<script setup lang="ts">
import { ref } from "vue";
import RawGeoJsonView from "./views/RawGeoJson.vue";

const isRenderRawMap = ref(true);
</script>

<template>
  <main>
    <RawGeoJsonView v-if="isRenderRawMap" />
    <div v-else>Main View</div>
  </main>
</template>
