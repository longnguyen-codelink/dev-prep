<script setup lang="ts">
import { BUILD_INFO } from "@/constants/endpoints";
</script>

<template>
  <!-- Shows which commit is deployed; hidden when the build info is missing (local dev). -->
  <a
    v-if="BUILD_INFO"
    :href="BUILD_INFO.url"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Build ${BUILD_INFO.shortHash}: open this commit on GitHub`"
    :aria-label="`Build ${BUILD_INFO.shortHash}: open this commit on GitHub`"
    class="bg-background text-muted-foreground hover:text-foreground fixed top-2 left-2 z-20 rounded-md border border-border px-2 py-0.5 font-mono text-xs shadow-xs transition-colors"
  >
    {{ BUILD_INFO.shortHash }}
  </a>
</template>
