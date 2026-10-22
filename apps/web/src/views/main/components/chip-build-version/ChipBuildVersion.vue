<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { BUILD_INFO } from "@/constants/endpoints";
</script>

<template>
  <!-- Shows which commit is deployed; hidden when the build info is missing (local dev). -->
  <Badge
    v-if="BUILD_INFO"
    as="a"
    variant="outline"
    :href="BUILD_INFO.url"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Build ${BUILD_INFO.shortHash}: open this commit on GitHub`"
    :aria-label="`Build ${BUILD_INFO.shortHash}: open this commit on GitHub`"
    class="bg-background text-muted-foreground fixed top-2 left-2 z-20 font-mono shadow-xs"
  >
    {{ BUILD_INFO.shortHash }}
  </Badge>
</template>
