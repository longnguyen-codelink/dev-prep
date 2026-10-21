import { addProtocol, type LineLayerSpecification, type Map } from "maplibre-gl";
import { Protocol } from "pmtiles";

import {
  BIG_ROADS_URL,
  cssVariableMap,
  MODES,
  type Mode,
  ROAD_PMTILES_URL,
  ROAD_TILE_MAX_ZOOM,
  ROAD_TILE_MIN_ZOOM,
  ROAD_TILES_URL,
  TILE_MODES,
  type TileMode,
} from "@/constants";
import { cssVarToRgba } from "@/lib/utils";

export const ROADS_SOURCE_ID = "roads";

const MAJOR_ROADS = ["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"];
const MEDIUM_ROADS = ["secondary", "secondary_link", "tertiary", "tertiary_link"];

function roadLayers(sourceLayer?: string): LineLayerSpecification[] {
  const root = document.documentElement;
  const sourceLayerProp = sourceLayer ? { "source-layer": sourceLayer } : {};

  return [
    {
      id: "roads-major",
      type: "line",
      source: ROADS_SOURCE_ID,
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
      source: ROADS_SOURCE_ID,
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
      source: ROADS_SOURCE_ID,
      ...sourceLayerProp,
      filter: ["!", ["in", ["get", "highway"], ["literal", [...MAJOR_ROADS, ...MEDIUM_ROADS]]]],
      paint: {
        "line-color": cssVarToRgba(cssVariableMap.chart3, root),
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.3, 16, 3],
      },
    },
  ];
}

// Z/x/y folder of .pbf files; `toSourceUrl` lets the benchmark route the URL through its protocol.
function addFolderTilesSource(map: Map, toSourceUrl: (url: string) => string) {
  map.addSource(ROADS_SOURCE_ID, {
    type: "vector",
    tiles: [toSourceUrl(ROAD_TILES_URL)],
    minzoom: ROAD_TILE_MIN_ZOOM,
    maxzoom: ROAD_TILE_MAX_ZOOM,
  });
}

let pmtilesRegistered = false;

// One PM Tiles archive read with HTTP range requests; the zoom range comes from the archive header.
function addPmtilesSource(map: Map) {
  if (!pmtilesRegistered) {
    addProtocol("pmtiles", new Protocol().tile);
    pmtilesRegistered = true;
  }
  map.addSource(ROADS_SOURCE_ID, { type: "vector", url: `pmtiles://${new URL(ROAD_PMTILES_URL, window.location.href).href}` });
}

// `toSourceUrl` lets the benchmark route the data URLs through its protocol; by default URLs are used as is.
export function addRoadsLayer(map: Map, mode: Mode, tileMode: TileMode, toSourceUrl: (url: string) => string = (url) => url): Map {
  if (mode !== MODES.TILES) map.addSource(ROADS_SOURCE_ID, { type: "geojson", data: toSourceUrl(BIG_ROADS_URL) });
  else if (tileMode === TILE_MODES.PM_TILES) addPmtilesSource(map);
  else addFolderTilesSource(map, toSourceUrl);

  for (const layer of roadLayers(mode === MODES.TILES ? "roads" : undefined)) map.addLayer(layer);

  return map;
}
