// Wrappers for the command-line programs the pipeline depends on (osmium, ogr2ogr, ...).
//
// This uses execFile, which does NOT start a shell: the arguments are passed as an array, so file
// names with spaces or quotes cannot be misread as commands. Do not "simplify" it to exec() with a
// command string.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { MAX_BUFFER_BYTES, REQUIRED_TOOLS } from "./constants.ts";
import { Logger } from "./logger.ts";
import { formatDuration, tryCatch } from "./utils.ts";

const execFileAsync = promisify(execFile);

export type ToolResult = { stdout: string; stderr: string; ms: number };
type RunToolOptions = { label?: string; quiet?: boolean };
type ExecError = Error & { code?: string | number; signal?: string; stderr?: string };

/** Runs an external tool, times it, and throws a readable error if it fails. */
export async function runTool(tool: string, args: string[], opts: RunToolOptions = {}): Promise<ToolResult> {
  const { label = `${tool} ${args[0] ?? ""}`.trim(), quiet = false } = opts;
  if (!quiet) Logger.info(`${label}: running`);
  const started = performance.now();

  const { data, error } = await tryCatch<{ stdout: string; stderr: string }, ExecError>(
    execFileAsync(tool, args, { maxBuffer: MAX_BUFFER_BYTES }),
  );

  if (error) {
    if (error.code === "ENOENT") throw new Error(`${tool} is not installed (run this inside the dev container)`, { cause: error });

    // A tool killed by a signal has no exit code; SIGKILL is usually the out-of-memory killer.
    const how = error.signal
      ? `killed by ${error.signal}${error.signal === "SIGKILL" ? ", probably out of memory" : ""}`
      : `exit ${error.code}`;
    // Tools like tippecanoe print long progress output; the end of stderr holds the actual error.
    const detail = (error.stderr?.split(/[\r\n]+/).filter(Boolean).slice(-8).join("\n") ?? "") || error.message;
    throw new Error(`${label} failed (${how}): ${detail}`, { cause: error });
  }

  const ms = Math.round(performance.now() - started);
  if (!quiet) Logger.info(`${label}: done in ${formatDuration(ms)}`);
  return { stdout: data.stdout, stderr: data.stderr, ms };
}

/**
 * Fails early, with a clear message, 
 * if a required tool is missing; logs each tool's version.
 */
export async function assertTools(): Promise<void> {
  for (const tool of REQUIRED_TOOLS) {
    const { stdout, stderr } = await runTool(tool, ["--version"], { quiet: true });
    Logger.info(`${tool}: ${(stdout || stderr).split("\n")[0]}`); // tippecanoe prints its version on stderr
  }
}
