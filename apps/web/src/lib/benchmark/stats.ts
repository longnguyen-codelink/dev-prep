import type { BenchmarkRun } from "./types";

type NumericField = "bytes" | "requests" | "readyMs" | "networkMs" | "afterDownloadMs" | "startupDelayMs";

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

// Failed runs never count.
export function medianOfOkRuns(runs: BenchmarkRun[], field: NumericField): number | null {
  const values: number[] = [];
  for (const run of runs) {
    const value = run[field];
    if (run.status === "ok" && value !== null) values.push(value);
  }
  return median(values);
}
