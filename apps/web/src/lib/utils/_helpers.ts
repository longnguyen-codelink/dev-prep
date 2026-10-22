type Success<T> = { data: T; error: undefined };
type Failure<Err = unknown> = { data: undefined; error: Err };
type Result<T, Err = unknown> = Success<T> | Failure<Err>;
export function tryCatch<T = void, Err = unknown>(fn: Promise<T>): Promise<Result<T, Err>> {
  return fn.then((data) => ({ data, error: undefined })).catch((error) => ({ data: undefined, error: error as Err }));
}

export function tryCatchSync<T = void, Err = unknown>(fn: () => T): Result<T, Err> {
  try {
    const data = fn();
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined, error: error as Err };
  }
}
