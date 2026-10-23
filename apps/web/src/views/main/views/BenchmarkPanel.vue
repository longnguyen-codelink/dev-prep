<script setup lang="ts">
import { computed, ref } from "vue";

import { Button } from "@/components/ui/button";
import { MODES, type Mode, type TileMode, VARIANTS, type Variant } from "@/constants";
import { clearRuns, formatBytes, formatMs, loadRuns, runsVersion, summarize, toMarkdownTable, variantOf, type MapSpec } from "@/lib/benchmark";

const props = defineProps<{ mode: Mode; tileMode: TileMode; spec: MapSpec; running: boolean; busy: boolean }>();
const emit = defineEmits<{ run: [] }>();

// Reading runsVersion makes these recompute when a run is saved or cleared.
function runsOf(variant: Variant) {
  void runsVersion.value;
  return loadRuns(variant);
}
const currentVariant = computed(() => variantOf(props.mode, props.tileMode));
const runs = computed(() => runsOf(currentVariant.value));
const geojson = computed(() => summarize(runsOf(VARIANTS.GEOJSON)));
const folder = computed(() => summarize(runsOf(VARIANTS.FOLDER)));
const pmtiles = computed(() => summarize(runsOf(VARIANTS.PM_TILES)));

const current = computed(() => summarize(runs.value));
const history = computed(() => [...runs.value].reverse());
const latest = computed(() => history.value[0]);

// The tile mode only applies to Tiles, so it is shown in the heading only there.
const title = computed(() => (props.mode === MODES.TILES ? `${props.mode} (${props.tileMode})` : props.mode));

const copied = ref(false);
async function copyTable() {
  await navigator.clipboard.writeText(toMarkdownTable({ geojson: geojson.value, folder: folder.value, pmtiles: pmtiles.value }));
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}

const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();
const countText = (value: number | null) => (value === null ? "-" : String(value));
</script>

<template>
  <aside class="h-screen min-w-0 flex-1 space-y-3 overflow-y-auto border-l bg-background p-3 text-xs">
    <header class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Benchmark: {{ title }}</h2>
      <div class="flex gap-2">
        <Button size="xs" :disabled="running || busy" @click="emit('run')">{{ running ? "Running..." : "Run" }}</Button>
        <Button size="xs" variant="outline" :disabled="runs.length === 0" @click="clearRuns(currentVariant)"> Clear </Button>
      </div>
    </header>

    <section>
      <p v-if="current.okRuns === 0" class="text-muted-foreground">No runs yet</p>
      <dl class="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5">
        <dt>Ready (from first data request), median</dt>
        <dd class="font-medium">{{ formatMs(current.readyMs) }}</dd>
        <dt>Overlay bytes, median</dt>
        <dd class="font-medium">{{ formatBytes(current.bytes) }}</dd>
        <dt>Total with boundary, median</dt>
        <dd class="font-medium">{{ formatBytes(current.totalBytes) }}</dd>
        <dt>Requests, median</dt>
        <dd class="font-medium">{{ countText(current.requests) }}</dd>
      </dl>
      <p class="mt-1 text-muted-foreground">
        Based on {{ current.okRuns }} ok run(s); {{ current.failedRuns }} failed and {{ current.hiddenRuns }} hidden-tab (not counted)
      </p>
    </section>

    <section v-if="latest">
      <h3 class="font-semibold">Latest run</h3>
      <p v-if="latest.status === 'failed'" class="text-destructive">Failed: {{ latest.reason }}</p>
      <dl class="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5">
        <dt>Network time</dt>
        <dd>{{ formatMs(latest.networkMs) }}</dd>
        <dt>After download</dt>
        <dd>{{ formatMs(latest.afterDownloadMs) }}</dd>
        <dt class="text-muted-foreground">Startup delay (not part of the comparison)</dt>
        <dd class="text-muted-foreground">{{ formatMs(latest.startupDelayMs) }}</dd>
        <dt>Missing files</dt>
        <dd>{{ latest.missingFiles }}</dd>
        <dt>Viewport</dt>
        <dd>{{ latest.viewport.width }} x {{ latest.viewport.height }}</dd>
        <dt>Visibility</dt>
        <dd>{{ latest.visibility }}</dd>
      </dl>
      <details v-if="latest.files?.length" class="mt-1">
        <summary class="cursor-pointer">Files ({{ latest.files.length }})</summary>
        <ul class="max-h-32 overflow-y-auto font-mono">
          <li v-for="file in latest.files" :key="file.url" class="flex justify-between gap-2">
            <span class="truncate">{{ file.url }}</span>
            <span class="shrink-0">{{ formatBytes(file.bytes) }}</span>
          </li>
        </ul>
      </details>
    </section>

    <section v-if="history.length">
      <h3 class="font-semibold">History</h3>
      <ul class="max-h-32 space-y-0.5 overflow-y-auto">
        <li v-for="run in history" :key="run.id">
          <template v-if="run.status === 'ok'">
            {{ formatTime(run.timestamp) }}: {{ formatMs(run.readyMs) }}, {{ formatBytes(run.bytes) }}, {{ run.requests }} req
          </template>
          <span v-else class="text-destructive"> {{ formatTime(run.timestamp) }}: failed, {{ run.reason }} </span>
        </li>
      </ul>
    </section>

    <section>
      <h3 class="font-semibold">Summary (median of counted runs)</h3>
      <table class="w-full">
        <thead>
          <tr class="text-left text-muted-foreground">
            <th></th>
            <th>GeoJSON</th>
            <th>Tiles (Folder)</th>
            <th>Tiles (PM Tiles)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ready</td>
            <td>{{ formatMs(geojson.readyMs) }}</td>
            <td>{{ formatMs(folder.readyMs) }}</td>
            <td>{{ formatMs(pmtiles.readyMs) }}</td>
          </tr>
          <tr>
            <td>Overlay bytes</td>
            <td>{{ formatBytes(geojson.bytes) }}</td>
            <td>{{ formatBytes(folder.bytes) }}</td>
            <td>{{ formatBytes(pmtiles.bytes) }}</td>
          </tr>
          <tr>
            <td>Total with boundary</td>
            <td>{{ formatBytes(geojson.totalBytes) }}</td>
            <td>{{ formatBytes(folder.totalBytes) }}</td>
            <td>{{ formatBytes(pmtiles.totalBytes) }}</td>
          </tr>
          <tr>
            <td>Requests</td>
            <td>{{ countText(geojson.requests) }}</td>
            <td>{{ countText(folder.requests) }}</td>
            <td>{{ countText(pmtiles.requests) }}</td>
          </tr>
          <tr>
            <td>Runs</td>
            <td>{{ geojson.okRuns }}</td>
            <td>{{ folder.okRuns }}</td>
            <td>{{ pmtiles.okRuns }}</td>
          </tr>
        </tbody>
      </table>
      <Button class="mt-2" size="xs" variant="outline" @click="copyTable">
        {{ copied ? "Copied" : "Copy as markdown table" }}
      </Button>
    </section>
  </aside>
</template>
