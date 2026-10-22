<script setup lang="ts">
import { computed, ref } from "vue";

import { Button } from "@/components/ui/button";
import {
  BENCHMARK_MAP_HEIGHT,
  BENCHMARK_MAP_WIDTH,
  BENCHMARK_MIN_RUNS,
  BENCHMARK_SLOW_STARTUP_MS,
  MODES,
  type Mode,
  type TileMode,
  VARIANTS,
  type Variant,
} from "@/constants";
import {
  clearRuns,
  formatBytes,
  formatMs,
  loadRuns,
  runsVersion,
  summarize,
  toMarkdownTable,
  variantOf,
  type MapSpec,
} from "@/lib/benchmark";

const props = defineProps<{ mode: Mode; tileMode: TileMode; spec: MapSpec; running: boolean; busy: boolean }>();
const emit = defineEmits<{ run: [] }>();
const { live, sizeOk, movedFromStart } = props.spec;

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

// Hints about the conditions of the runs, not about the map data.
const hints = computed(() => {
  const list: { warn: boolean; text: string }[] = [];
  if (live.value.width > 0 && !sizeOk.value)
    list.push({
      warn: true,
      text: `Map is ${live.value.width} x ${live.value.height}, not ${BENCHMARK_MAP_WIDTH} x ${BENCHMARK_MAP_HEIGHT}: widen the window so the box is not clipped, then press Run.`,
    });
  if (movedFromStart.value) list.push({ warn: true, text: "The camera moved from the start view; press Run again to start from a clean load." });
  if (current.value.okRuns < BENCHMARK_MIN_RUNS)
    list.push({
      warn: false,
      text: `Press Run until you have at least ${BENCHMARK_MIN_RUNS} ok runs per mode (now ${current.value.okRuns} here).`,
    });
  if (latest.value && latest.value.visibility !== "visible")
    list.push({ warn: true, text: "The latest run had a hidden tab: timers and rendering were throttled, so discard it." });
  if (latest.value?.startupDelayMs != null && latest.value.startupDelayMs > BENCHMARK_SLOW_STARTUP_MS)
    list.push({
      warn: false,
      text: `The latest page start was slow (${formatMs(latest.value.startupDelayMs)}); it is not in the comparison, but the browser may be busy.`,
    });
  if (latest.value && latest.value.missingFiles > 0 && props.mode === MODES.GEOJSON)
    list.push({ warn: true, text: "The GeoJSON file was reported missing; check the link in public/map." });
  const conditions = new Set(runs.value.map((run) => `${run.viewport.width}x${run.viewport.height}|${run.userAgent}`));
  if (conditions.size > 1) list.push({ warn: true, text: "Stored runs mix different viewports or browsers; clear the runs before recording." });
  list.push({ warn: false, text: "Bytes are the encoded bytes on the wire: compressed when the host compresses (the deployed site does for GeoJSON, the dev server does not)." });
  return list;
});

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
        <dt>Bytes, median</dt>
        <dd class="font-medium">{{ formatBytes(current.bytes) }}</dd>
        <dt>Requests, median</dt>
        <dd class="font-medium">{{ countText(current.requests) }}</dd>
      </dl>
      <p class="mt-1 text-muted-foreground">Based on {{ current.okRuns }} ok run(s); {{ current.failedRuns }} failed (not counted)</p>
    </section>

    <section>
      <h3 class="font-semibold">Recommendations</h3>
      <ul class="space-y-1">
        <li v-for="hint in hints" :key="hint.text" :class="hint.warn ? 'text-destructive' : 'text-muted-foreground'">
          {{ hint.warn ? "Warning: " : "" }}{{ hint.text }}
        </li>
      </ul>
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
      <h3 class="font-semibold">Summary (median of ok runs)</h3>
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
            <td>Bytes</td>
            <td>{{ formatBytes(geojson.bytes) }}</td>
            <td>{{ formatBytes(folder.bytes) }}</td>
            <td>{{ formatBytes(pmtiles.bytes) }}</td>
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
