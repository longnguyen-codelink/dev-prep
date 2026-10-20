type Success<T> = { data: T; error: undefined };
type Failure<Err = unknown> = { data: undefined; error: Err };
type Result<T, Err = unknown> = Success<T> | Failure<Err>;
export function tryCatch<T = void, Err = unknown>(fn: Promise<T>): Promise<Result<T, Err>> {
  return fn.then((data) => ({ data, error: undefined })).catch((error) => ({ data: undefined, error: error as Err }));
}

/** Decimal units, like the track's budgets: 1 MB = 1,000,000 bytes. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
