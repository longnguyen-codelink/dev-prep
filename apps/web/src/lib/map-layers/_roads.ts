import type { LineLayerSpecification, Map } from "maplibre-gl";

import {
  BIG_ROADS_URL,
  cssVariableMap,
  ROAD_TILE_MAX_ZOOM,
  ROAD_TILE_MIN_ZOOM,
  ROAD_TILES_URL,
} from "@/constants";
import { cssVarToRgba } from "@/lib/utils";

export type RoadsMode = "tiles" | "geojson";

const MAJOR_ROADS = ["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"];
const MEDIUM_ROADS = ["secondary", "secondary_link", "tertiary", "tertiary_link"];

function roadLayers(sourceLayer?: string): LineLayerSpecification[] {
  const root = document.documentElement;
  const sourceLayerProp = sourceLayer ? { "source-layer": sourceLayer } : {};

  return [
    {
      id: "roads-major",
      type: "line",
      source: "roads",
      ...sourceLayerProp,
      filter: ["in", ["get", "highway"], ["literal", MAJOR_ROADS]],
      paint: {
        "line-color": cssVarToRgba(cssVariableMap.chart1, root),
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 16, 10],
      },
    },
    {
      id: "roads-medium",
      type: "line",
      source: "roads",
      ...sourceLayerProp,
      filter: ["in", ["get", "highway"], ["literal", MEDIUM_ROADS]],
      paint: {
        "line-color": cssVarToRgba(cssVariableMap.chart2, root),
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 6],
      },
    },
    {
      id: "roads-minor",
      type: "line",
      source: "roads",
      ...sourceLayerProp,
      filter: ["!", ["in", ["get", "highway"], ["literal", [...MAJOR_ROADS, ...MEDIUM_ROADS]]]],
      paint: {
        "line-color": cssVarToRgba(cssVariableMap.chart3, root),
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.3, 16, 3],
      },
    },
  ];
}

// `toSourceUrl` lets the benchmark route the data URLs through its protocol; by default URLs are used as is.
export function addRoadsLayer(
  map: Map,
  mode: RoadsMode,
  toSourceUrl: (url: string) => string = (url) => url,
): Map {
  if (mode === "tiles") {
    map.addSource("roads", {
      type: "vector",
      tiles: [toSourceUrl(ROAD_TILES_URL)],
      minzoom: ROAD_TILE_MIN_ZOOM,
      maxzoom: ROAD_TILE_MAX_ZOOM,
    });
  } else {
    map.addSource("roads", {
      type: "geojson",
      data: toSourceUrl(BIG_ROADS_URL),
    });
  }

  for (const layer of roadLayers(mode === "tiles" ? "roads" : undefined)) {
    map.addLayer(layer);
  }

  return map;
}
