import { isCounted, medianOfOkRuns, medianTotalBytes } from "./_stats";
import type { BenchmarkRun } from "./_types";

// Decimal units, like the CLI's formatBytes: 1 MB = 1,000,000 bytes.
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return "-";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
}

export function formatMs(ms: number | null): string {
  if (ms === null) return "-";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export type ModeSummary = {
  okRuns: number;
  failedRuns: number;
  hiddenRuns: number; // ok but taken in a hidden tab: not counted
  readyMs: number | null;
  bytes: number | null;
  totalBytes: number | null; // overlay bytes plus the boundary file
  requests: number | null;
};

export function summarize(runs: BenchmarkRun[]): ModeSummary {
  const okRuns = runs.filter(isCounted).length;
  const hiddenRuns = runs.filter((run) => run.status === "ok" && run.visibility === "hidden").length;
  return {
    okRuns,
    failedRuns: runs.length - okRuns - hiddenRuns,
    hiddenRuns,
    readyMs: medianOfOkRuns(runs, "readyMs"),
    bytes: medianOfOkRuns(runs, "bytes"),
    totalBytes: medianTotalBytes(runs),
    requests: medianOfOkRuns(runs, "requests"),
  };
}

// One column per variant; a variant with no ok runs shows "-" (its Runs cell shows 0).
export function toMarkdownTable(summaries: { geojson: ModeSummary; folder: ModeSummary; pmtiles: ModeSummary }): string {
  const columns = [summaries.geojson, summaries.folder, summaries.pmtiles];
  const row = (label: string, pick: (s: ModeSummary) => string) => `| ${label} | ${columns.map((s) => pick(s)).join(" | ")} |`;
  return [
    "| Metric (median of counted runs) | GeoJSON | Tiles (Folder) | Tiles (PM Tiles) |",
    "| --- | --- | --- | --- |",
    row("Ready (from first data request)", (s) => formatMs(s.readyMs)),
    row("Overlay bytes transferred", (s) => formatBytes(s.bytes)),
    row("Total bytes with boundary", (s) => formatBytes(s.totalBytes)),
    row("Requests", (s) => (s.requests === null ? "-" : String(s.requests))),
    row("Runs counted", (s) => String(s.okRuns)),
    row("Hidden-tab runs (excluded)", (s) => String(s.hiddenRuns)),
  ].join("\n");
}
