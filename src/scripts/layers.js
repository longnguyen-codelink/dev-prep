import * as maplibregl from "../vendor/maplibre-gl.mjs";
import { CITADEL_ROADS_URL, CITADEL_OUTLINE_URL } from "./config.js";

// highway value -> [colour, base width in px]
const ROAD_STYLES = {
  primary: ["#c0392b", 4],
  primary_link: ["#c0392b", 3],
  secondary: ["#e67e22", 3],
  tertiary: ["#8e44ad", 2.5],
  residential: ["#2c3e50", 2],
  service: ["#7f8c8d", 1.5],
  footway: ["#16a085", 1.5],
};
const FALLBACK_STYLE = ["#34495e", 1.5];

function matchHighway(pick) {
  const expr = ["match", ["get", "highway"]];
  for (const [highway, style] of Object.entries(ROAD_STYLES)) expr.push(highway, pick(style));
  expr.push(pick(FALLBACK_STYLE));
  return expr;
}

function popupContent(properties) {
  // Built with textContent: OSM names are untrusted, so never inject them as HTML.
  const box = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = properties.name || "(unnamed)";
  const detail = document.createElement("div");
  detail.textContent = `highway: ${properties.highway}`;
  box.append(title, detail);
  return box;
}

export function addCitadelLayers(map) {
  map.addSource("citadel-outline", { type: "geojson", data: CITADEL_OUTLINE_URL });
  map.addLayer({
    id: "citadel-outline",
    type: "line",
    source: "citadel-outline",
    paint: { "line-color": "#2980b9", "line-width": 2, "line-dasharray": [3, 2] },
  });

  map.addSource("citadel-roads", { type: "geojson", data: CITADEL_ROADS_URL });
  map.addLayer({
    id: "citadel-roads",
    type: "line",
    source: "citadel-roads",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": matchHighway(([colour]) => colour),
      "line-width": [
        "interpolate", ["linear"], ["zoom"],
        13, ["*", 0.5, matchHighway(([, width]) => width)],
        18, ["*", 2, matchHighway(([, width]) => width)],
      ],
    },
  });

  map.on("click", "citadel-roads", (event) => {
    new maplibregl.Popup()
      .setLngLat(event.lngLat)
      .setDOMContent(popupContent(event.features[0].properties))
      .addTo(map);
  });
  map.on("mouseenter", "citadel-roads", () => (map.getCanvas().style.cursor = "pointer"));
  map.on("mouseleave", "citadel-roads", () => (map.getCanvas().style.cursor = ""));
}
