import { addProtocol, type FilterSpecification, type LineLayerSpecification, type Map, Popup } from "maplibre-gl";
import { PMTiles, Protocol, type Source } from "pmtiles";

import {
  DEFAULT_ROAD_MIN_ZOOM,
  LAYER_GROUPS,
  MODES,
  type Mode,
  ROAD_CLASS_MIN_ZOOM,
  ROAD_CLICK_TOLERANCE_PX,
  ROAD_TILE_MAX_ZOOM,
  ROAD_TILE_MIN_ZOOM,
  TILE_MODES,
  type TileMode,
} from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { createPmtilesSource, entryColors, layerIdsOf, layerMetadata } from "@/lib/utils";

export const ROADS_SOURCE_ID = "roads";

const ROADS_METADATA = layerMetadata(LAYER_GROUPS.ROADS);

const MAJOR_ROADS = ["motorway", "motorway_link", "trunk", "trunk_link", "primary", "primary_link"];
const MEDIUM_ROADS = ["secondary", "secondary_link", "tertiary", "tertiary_link"];

type RoadTier = "major" | "medium" | "minor";
const ROAD_TIERS: RoadTier[] = ["major", "medium", "minor"];

// Colour and width per tier; the tile-mode and GeoJSON-mode layers share these.
function roadPaint(tier: RoadTier, root: HTMLElement): LineLayerSpecification["paint"] {
  switch (tier) {
    case "major":
      return {
        "line-color": entryColors("major", root)[0]!,
        "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 16, 10],
      };
    case "medium":
      return {
        "line-color": entryColors("medium", root)[0]!,
        "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 16, 6],
      };
    case "minor":
      return {
        "line-color": entryColors("minor", root)[0]!,
        "line-width": ["interpolate", ["linear"], ["zoom"], 13, 0.3, 16, 3],
      };
  }
}

function roadLayers(sourceLayer?: string): LineLayerSpecification[] {
  const root = document.documentElement;
  const sourceLayerProp = sourceLayer ? { "source-layer": sourceLayer } : {};

  return [
    {
      id: "roads-major",
      type: "line",
      source: ROADS_SOURCE_ID,
      ...sourceLayerProp,
      metadata: ROADS_METADATA,
      filter: ["in", ["get", "highway"], ["literal", MAJOR_ROADS]],
      paint: roadPaint("major", root),
    },
    {
      id: "roads-medium",
      type: "line",
      source: ROADS_SOURCE_ID,
      ...sourceLayerProp,
      metadata: ROADS_METADATA,
      filter: ["in", ["get", "highway"], ["literal", MEDIUM_ROADS]],
      paint: roadPaint("medium", root),
    },
    {
      id: "roads-minor",
      type: "line",
      source: ROADS_SOURCE_ID,
      ...sourceLayerProp,
      metadata: ROADS_METADATA,
      filter: ["!", ["in", ["get", "highway"], ["literal", [...MAJOR_ROADS, ...MEDIUM_ROADS]]]],
      paint: roadPaint("minor", root),
    },
  ];
}

// Table classes are base names; each also matches its _link variant.
function withLinks(highways: string[]): string[] {
  return highways.flatMap((highway) => [highway, `${highway}_link`]);
}

function tierOf(highway: string): RoadTier {
  if (MAJOR_ROADS.includes(highway)) return "major";
  if (MEDIUM_ROADS.includes(highway)) return "medium";
  return "minor";
}

function roadLayer(tier: RoadTier, root: HTMLElement, minzoom: number, filter: FilterSpecification): LineLayerSpecification {
  return {
    id: `roads-${tier}-z${minzoom}`,
    type: "line",
    source: ROADS_SOURCE_ID,
    metadata: ROADS_METADATA,
    minzoom,
    filter,
    paint: roadPaint(tier, root),
  };
}

// GeoJSON mode draws each class from its ROAD_CLASS_MIN_ZOOM, like the tile build does.
// MapLibre filters cannot depend on zoom, so each (tier, zoom) group is its own layer with a minzoom.
function roadLayersByZoom(): LineLayerSpecification[] {
  const root = document.documentElement;
  const classes = Object.keys(ROAD_CLASS_MIN_ZOOM);
  const layers: LineLayerSpecification[] = [];

  for (const tier of ROAD_TIERS) {
    const tierClasses = classes.filter((highway) => tierOf(highway) === tier);
    const zooms = [...new Set(tierClasses.map((highway) => ROAD_CLASS_MIN_ZOOM[highway]))].sort((a, b) => a - b);
    for (const minzoom of zooms) {
      const highways = tierClasses.filter((highway) => ROAD_CLASS_MIN_ZOOM[highway] === minzoom);
      layers.push(roadLayer(tier, root, minzoom, ["in", ["get", "highway"], ["literal", withLinks(highways)]]));
    }
  }

  // Every class not in the table, and a missing highway, is drawn from the default zoom.
  layers.push(roadLayer("minor", root, DEFAULT_ROAD_MIN_ZOOM, ["!", ["in", ["get", "highway"], ["literal", withLinks(classes)]]]));

  return layers;
}

// Z/x/y folder of .pbf files; `toSourceUrl` lets the benchmark route the URL through its protocol.
function addFolderTilesSource(map: Map, toSourceUrl: (url: string) => string) {
  map.addSource(ROADS_SOURCE_ID, {
    type: "vector",
    tiles: [toSourceUrl(MAP_URLS.tiles)],
    minzoom: ROAD_TILE_MIN_ZOOM,
    maxzoom: ROAD_TILE_MAX_ZOOM,
  });
}

const pmtilesProtocol = new Protocol();
let pmtilesRegistered = false;

// One PM Tiles archive read with HTTP range requests; the zoom range comes from the archive header.
// `toPmtilesSource` lets the benchmark supply a source whose range requests are tagged.
// The archive is read through our own source so range reads bypass the browser cache.
function addPmtilesSource(map: Map, toPmtilesSource?: (url: string) => Source) {
  if (!pmtilesRegistered) {
    addProtocol("pmtiles", pmtilesProtocol.tile);
    pmtilesRegistered = true;
  }
  const archiveUrl = new URL(MAP_URLS.pmtiles, window.location.href).href;
  const source = toPmtilesSource ? toPmtilesSource(archiveUrl) : createPmtilesSource(archiveUrl);
  pmtilesProtocol.add(new PMTiles(source));
  map.addSource(ROADS_SOURCE_ID, { type: "vector", url: `pmtiles://${archiveUrl}` });
}

// `toSourceUrl` and `toPmtilesSource` let the benchmark route the data through its protocol; by default URLs are used as is.
export function addRoadsLayer(
  map: Map,
  mode: Mode,
  tileMode: TileMode,
  toSourceUrl: (url: string) => string = (url) => url,
  toPmtilesSource?: (url: string) => Source,
): Map {
  if (mode !== MODES.TILES) {
    map.addSource(ROADS_SOURCE_ID, { type: "geojson", data: toSourceUrl(MAP_URLS.roadsGeoJson), maxzoom: ROAD_TILE_MAX_ZOOM });
  } else if (tileMode === TILE_MODES.PM_TILES) addPmtilesSource(map, toPmtilesSource);
  else addFolderTilesSource(map, toSourceUrl);

  const layers = mode === MODES.TILES ? roadLayers("roads") : roadLayersByZoom();
  for (const layer of layers) map.addLayer(layer);

  return map;
}

// The road features under a point, topmost first. A box, because roads are thin lines.
function roadsAt(map: Map, layers: string[], x: number, y: number) {
  const r = ROAD_CLICK_TOLERANCE_PX;
  return map.queryRenderedFeatures(
    [
      [x - r, y - r],
      [x + r, y + r],
    ],
    { layers },
  );
}

// Popup body. Built with textContent because the name and class come from data, never as HTML.
function roadPopupContent(properties: Record<string, unknown>): HTMLElement {
  const name = typeof properties.name === "string" ? properties.name.trim() : "";
  const highway = typeof properties.highway === "string" && properties.highway ? properties.highway : "unknown";

  const content = document.createElement("div");
  const title = document.createElement("div");
  title.className = "font-semibold";
  title.textContent = name || "Unnamed road";
  const detail = document.createElement("div");
  detail.className = "text-xs text-muted-foreground";
  detail.textContent = `Class: ${highway}`;
  content.append(title, detail);
  return content;
}

// One popup per map, moved to each clicked road. closeOnClick is off: MapLibre's close listener runs on every click,
// including road clicks, and would close the popup it was just moved to. The click on empty map closes it below.
export function addRoadsPopup(map: Map): void {
  const popup = new Popup({ closeButton: true, closeOnClick: false, maxWidth: "240px", offset: 6 });
  // Looked up once, after the road layers are added: map.getStyle() serialises the whole style, too slow for every mouse move.
  const roadLayers = layerIdsOf(map, LAYER_GROUPS.ROADS);

  map.on("click", (event) => {
    const [feature] = roadsAt(map, roadLayers, event.point.x, event.point.y);
    if (!feature) {
      popup.remove();
      return;
    }
    popup.setLngLat(event.lngLat).setDOMContent(roadPopupContent(feature.properties)).addTo(map);
  });

  // Empty string gives back the cursor from the stylesheet (MapLibre's grab cursor) rather than forcing an arrow.
  map.on("mousemove", (event) => {
    map.getCanvas().style.cursor = roadsAt(map, roadLayers, event.point.x, event.point.y).length > 0 ? "pointer" : "";
  });
}
