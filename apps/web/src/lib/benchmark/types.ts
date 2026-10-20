import type { RoadsMode } from "@/lib/map-layers";

export type BenchmarkRun = {
  id: string;
  mode: RoadsMode;
  timestamp: number; // Date.now() when the run finished
  status: "ok" | "failed";
  reason?: string;
  // Overlay data only: encodedBodySize summed over its requests (missing tiles excluded).
  bytes: number;
  requests: number;
  missingFiles: number;
  files?: { url: string; bytes: number }[]; // served overlay files, url without the run tag; absent in older stored runs
  // All in ms; null when the run failed before the value existed.
  startupDelayMs: number | null; // page mount to the first data request
  networkMs: number | null; // first data request start to last response end
  afterDownloadMs: number | null; // ready minus last response end
  readyMs: number | null; // measured from the first data request start, not page mount
  viewport: { width: number; height: number };
  visibility: DocumentVisibilityState;
  userAgent: string;
};

declare global {
  interface Window {
    __benchmarkRun?: BenchmarkRun;
  }
}
