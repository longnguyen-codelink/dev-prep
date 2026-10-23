import type { BenchmarkRun } from "./_types";

type NumericField = "bytes" | "requests" | "readyMs" | "networkMs" | "afterDownloadMs" | "startupDelayMs";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

// Failed runs never count, and neither do runs from a tab that was hidden at any point (throttled timers and rendering).
export const isCounted = (run: BenchmarkRun) => run.status === "ok" && run.visibility !== "hidden";

export function medianOfOkRuns(runs: BenchmarkRun[], field: NumericField): number | null {
  const values: number[] = [];
  for (const run of runs) {
    const value = run[field];
    if (isCounted(run) && value !== null) values.push(value);
  }
  return median(values);
}

// Overlay bytes plus the boundary file; runs stored before the boundary was measured are left out.
export function medianTotalBytes(runs: BenchmarkRun[]): number | null {
  const values: number[] = [];
  for (const run of runs) {
    if (isCounted(run) && typeof run.boundaryBytes === "number") values.push(run.bytes + run.boundaryBytes);
  }
  return median(values);
}
