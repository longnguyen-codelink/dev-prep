// Baseline measurement harness (Phase 4). Loaded only when the URL has ?bench.
// It drives the page the same way on every run so the numbers are comparable:
//   1. control: scripted pan/zoom with the big layer OFF
//   2. switch the big layer ON and time data load and first complete render
//   3. the same scripted pan/zoom with the big layer ON
import { START_CENTER, START_ZOOM } from "./config.js";
import { setBigRoadsVisible } from "./layers.js";

const CAMERA_PATH = [
  { center: [106.7, 10.78], zoom: 14, duration: 2000 },
  { center: [106.74, 10.79], zoom: 14, duration: 3000 },
  { center: [106.66, 10.74], zoom: 14, duration: 3000 },
  { center: [106.7, 10.78], zoom: 11, duration: 2000 },
];
const LOAD_TIMEOUT_MS = 180000;

const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

function whenIdle(map) {
  return new Promise((resolve) =>
    map.loaded() ? resolve() : map.once("idle", resolve),
  );
}

function observeLongTasks() {
  const tasks = [];
  try {
    const observer = new PerformanceObserver((list) =>
      tasks.push(...list.getEntries()),
    );
    observer.observe({ type: "longtask" });
    return { stop: () => (observer.disconnect(), tasks) };
  } catch {
    return { stop: () => null }; // long task API not available
  }
}

function heapMB() {
  return performance.memory
    ? Math.round(performance.memory.usedJSHeapSize / 1048576)
    : null;
}

function percentile(sorted, p) {
  return sorted[
    Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  ];
}

function frameStats(stamps, longTasks) {
  const intervals = stamps.slice(1).map((t, i) => t - stamps[i]);
  const sorted = [...intervals].sort((a, b) => a - b);
  const seconds = (stamps[stamps.length - 1] - stamps[0]) / 1000;
  const round1 = (n) => Math.round(n * 10) / 10;
  return {
    frames: stamps.length,
    seconds: round1(seconds),
    avgFps: round1(stamps.length / seconds),
    medianFrameMs: round1(percentile(sorted, 50)),
    p95FrameMs: round1(percentile(sorted, 95)),
    maxFrameMs: round1(sorted[sorted.length - 1]),
    framesOver33ms: intervals.filter((ms) => ms > 33.4).length,
    framesOver100ms: intervals.filter((ms) => ms > 100).length,
    longTasks: longTasks ? longTasks.length : null,
    longTaskTotalMs: longTasks
      ? Math.round(longTasks.reduce((sum, t) => sum + t.duration, 0))
      : null,
  };
}

async function runCameraPath(map) {
  map.jumpTo({ center: START_CENTER, zoom: START_ZOOM });
  await whenIdle(map);

  const stamps = [];
  let running = true;
  const tick = (t) => {
    stamps.push(t);
    if (running) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const longTasks = observeLongTasks();

  for (const step of CAMERA_PATH) {
    await new Promise((resolve) => {
      map.once("moveend", resolve);
      map.easeTo({ ...step, easing: (t) => t, essential: true });
    });
  }

  running = false;
  await nextFrame();
  return frameStats(stamps, longTasks.stop());
}

function loadBigLayer(map) {
  const started = performance.now();
  const dataLoaded = new Promise((resolve) => {
    const onData = (event) => {
      if (event.sourceId === "hcmc-roads" && event.isSourceLoaded) {
        map.off("sourcedata", onData);
        resolve(performance.now() - started);
      }
    };
    map.on("sourcedata", onData);
  });
  const timeout = new Promise((resolve) =>
    setTimeout(() => resolve(null), LOAD_TIMEOUT_MS),
  );

  setBigRoadsVisible(map, true);
  return Promise.race([dataLoaded, timeout]).then(async (dataLoadedMs) => {
    if (dataLoadedMs === null)
      return { timedOut: true, afterMs: LOAD_TIMEOUT_MS };
    await nextFrame();
    await nextFrame();
    await whenIdle(map);
    return {
      timedOut: false,
      dataLoadedMs: Math.round(dataLoadedMs),
      firstRenderMs: Math.round(performance.now() - started),
    };
  });
}

export async function runBaseline(map) {
  if (map.getSource("hcmc-roads")) {
    throw new Error(
      "The big layer is already loaded. Reload the page (keeping ?bench) before running again.",
    );
  }
  await whenIdle(map);
  const env = {
    date: new Date().toISOString(),
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    start: { center: START_CENTER, zoom: START_ZOOM },
  };

  const control = await runCameraPath(map);

  map.jumpTo({ center: START_CENTER, zoom: START_ZOOM });
  await whenIdle(map);
  const heapBeforeMB = heapMB();
  const load = await loadBigLayer(map);
  const heapAfterMB = heapMB();
  document.getElementById("toggle-big-roads").checked = true; // keep the checkbox in sync

  const withBigLayer = load.timedOut ? null : await runCameraPath(map);
  return {
    env,
    control,
    load: { ...load, heapBeforeMB, heapAfterMB },
    withBigLayer,
  };
}

const fmtTime = (ms) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`;

const FRAME_ROWS = [
  ["Average frame rate", (s) => `${s.avgFps} fps`],
  ["Typical frame", (s) => `${s.medianFrameMs} ms`],
  ["Slow frame (95th percentile)", (s) => `${s.p95FrameMs} ms`],
  ["Slowest frame", (s) => `${s.maxFrameMs} ms`],
  ["Frames slower than 33 ms", (s) => s.framesOver33ms],
  ["Frames slower than 100 ms", (s) => s.framesOver100ms],
  [
    "Long tasks (page blocked)",
    (s) =>
      s.longTasks === null ? "n/a" : `${s.longTasks} (${s.longTaskTotalMs} ms)`,
  ],
];

function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function table(headers, rows) {
  const t = el("table");
  const head = el("tr");
  headers.forEach((h) => head.append(el("th", h)));
  t.append(head);
  rows.forEach((cells) => {
    const tr = el("tr");
    cells.forEach((c) => tr.append(el("td", String(c))));
    t.append(tr);
  });
  return t;
}

function isSmooth(stats) {
  return stats.avgFps >= 55 && stats.framesOver100ms === 0;
}

function renderResult(result) {
  const box = el("div");
  if (result.error) {
    box.append(el("p", `The run failed: ${result.error}`));
    return box;
  }

  const { env, control, load, withBigLayer } = result;
  const chrome = /Chrome\/(\d+)/.exec(env.userAgent);
  box.append(
    el(
      "p",
      `Chrome ${chrome ? chrome[1] : "?"} · ${env.viewport} at ${env.devicePixelRatio}x · ${env.date.slice(0, 16).replace("T", " ")} UTC`,
      "meta",
    ),
  );

  box.append(el("h4", "Loading the big layer"));
  if (load.timedOut) {
    box.append(
      el(
        "p",
        `Gave up after ${fmtTime(load.afterMs)}: the layer never finished loading.`,
        "bad",
      ),
    );
    return box;
  }
  box.append(
    table(
      ["", ""],
      [
        ["Data loaded after", fmtTime(load.dataLoadedMs)],
        ["First full render after", fmtTime(load.firstRenderMs)],
        [
          "Page JS memory",
          load.heapBeforeMB === null
            ? "n/a"
            : `${load.heapBeforeMB} MB to ${load.heapAfterMB} MB (+${load.heapAfterMB - load.heapBeforeMB} MB)`,
        ],
      ],
    ),
  );

  box.append(
    el(
      "h4",
      `Panning and zooming (${control.seconds} s, same path both times)`,
    ),
  );
  box.append(
    table(
      ["", "Layer off", "Layer on"],
      FRAME_ROWS.map(([label, read]) => [
        label,
        read(control),
        read(withBigLayer),
      ]),
    ),
  );

  const verdict = isSmooth(withBigLayer)
    ? "Smooth with the layer on: at least 55 fps and no frame over 100 ms."
    : "Choppy with the layer on: below 55 fps or at least one frame over 100 ms.";
  box.append(el("p", verdict, isSmooth(withBigLayer) ? "good" : "bad"));
  return box;
}

export function mountBenchPanel(map, autoRun) {
  const panel = el("div", undefined, "panel bench");
  const button = el("button", "Run baseline");
  const status = el(
    "p",
    "Ready. A run takes about 30 seconds. Reload the page between runs.",
    "meta",
  );
  const results = el("div");
  const raw = el("details");
  const copy = el("button", "Copy JSON");
  const json = el("pre");
  raw.append(el("summary", "Raw JSON"), copy, json);
  raw.hidden = true;
  panel.append(button, status, results, raw);
  document.body.append(panel);

  const run = async () => {
    button.disabled = true;
    status.textContent = "Running... keep this tab in front.";
    results.replaceChildren();
    raw.hidden = true;
    window.__baselineDone = false;
    try {
      window.__baselineResult = await runBaseline(map);
    } catch (error) {
      window.__baselineResult = { error: String(error) };
    }
    window.__baselineDone = true;
    const text = JSON.stringify(window.__baselineResult, null, 2);
    results.replaceChildren(renderResult(window.__baselineResult));
    json.textContent = text;
    raw.hidden = false;
    status.textContent = "Done.";
    console.log("baseline result", JSON.stringify(window.__baselineResult));
    button.disabled = false;
  };

  copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(json.textContent);
    copy.textContent = "Copied";
    setTimeout(() => (copy.textContent = "Copy JSON"), 1500);
  });
  button.addEventListener("click", run);
  if (autoRun) run();
}
