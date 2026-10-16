import * as maplibregl from "../vendor/maplibre-gl.mjs";
import { BASEMAP_STYLE, START_CENTER, START_ZOOM } from "./config.js";
import { addCitadelLayers, setBigRoadsVisible } from "./layers.js";

const map = new maplibregl.Map({
  container: "map",
  style: BASEMAP_STYLE,
  center: START_CENTER,
  zoom: START_ZOOM,
});

map.addControl(new maplibregl.NavigationControl(), "top-right");

const bigRoadsToggle = document.getElementById("toggle-big-roads");
bigRoadsToggle.addEventListener("change", () => setBigRoadsVisible(map, bigRoadsToggle.checked));

map.on("load", async () => {
  addCitadelLayers(map);
  bigRoadsToggle.disabled = false;

  // ?bench shows the measurement panel, ?bench=auto also runs it. Loaded on demand so normal
  // page loads carry no measurement code.
  const bench = new URLSearchParams(location.search).get("bench");
  if (bench !== null) {
    const { mountBenchPanel } = await import("./measure.js");
    mountBenchPanel(map, bench === "auto");
  }
});
