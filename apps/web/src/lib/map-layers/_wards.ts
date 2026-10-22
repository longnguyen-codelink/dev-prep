import type { Map } from "maplibre-gl";

import { cssVariableMap, LAYER_GROUPS, MODES, type Mode, WARD_LABEL_MIN_ZOOM, WARD_OUTLINE_MIN_ZOOM, WARDS_SOURCE_LAYER } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba, entryColors, firstLayerOf, layerMetadata } from "@/lib/utils";

import { ROADS_SOURCE_ID } from "./_roads";

export const WARDS_SOURCE_ID = "wards";
const WARDS_FILL_ID = "wards-fill";
const WARDS_LINE_ID = "wards-line";
const WARDS_LABELS_ID = "wards-labels";

// Called when the Wards group is first switched on. In the tile modes the wards are a layer of the same vector source as
// the roads, so nothing is requested here (their data already arrived with the tiles). GeoJSON mode has no tiles: it
// requests the ward file (about 1 MB) now. The fill and outline go below the roads so road lines stay on top of them;
// the names go on top so roads do not cross them.
export function addWardsLayer(map: Map, mode: Mode): Map {
  const root = document.documentElement;
  const metadata = layerMetadata(LAYER_GROUPS.WARDS);

  const fromTiles = mode === MODES.TILES;
  if (!fromTiles) map.addSource(WARDS_SOURCE_ID, { type: "geojson", data: MAP_URLS.wardsGeoJson });
  const source = fromTiles ? ROADS_SOURCE_ID : WARDS_SOURCE_ID;
  const sourceLayer = fromTiles ? { "source-layer": WARDS_SOURCE_LAYER } : {};

  // Each ward is tinted with one of the five chart colours, picked from its OSM id, so neighbouring wards are mostly
  // told apart. The colour is not coordinated between neighbours: two adjacent wards can get the same tint.
  const roadsId = firstLayerOf(map, LAYER_GROUPS.ROADS);
  const [tint0, tint1, tint2, tint3, tint4] = entryColors("ward-fill", root) as [string, string, string, string, string];
  map.addLayer(
    {
      id: WARDS_FILL_ID,
      type: "fill",
      source,
      ...sourceLayer,
      metadata,
      minzoom: WARD_OUTLINE_MIN_ZOOM,
      paint: {
        "fill-color": ["match", ["%", ["to-number", ["get", "osm_id"]], 5], 0, tint0, 1, tint1, 2, tint2, 3, tint3, tint4],
        "fill-opacity": 0.2,
      },
    },
    roadsId,
  );

  map.addLayer(
    {
      id: WARDS_LINE_ID,
      type: "line",
      source,
      ...sourceLayer,
      metadata,
      minzoom: WARD_OUTLINE_MIN_ZOOM,
      paint: {
        // Dashed and dark: the chart colours blend into the basemap's yellow roads and the overlay roads.
        "line-color": entryColors("ward-outline", root)[0]!,
        "line-width": ["interpolate", ["linear"], ["zoom"], WARD_OUTLINE_MIN_ZOOM, 1.5, 16, 3],
        "line-dasharray": [3, 2],
        "line-opacity": 0.9,
      },
    },
    roadsId,
  );

  // "Noto Sans Regular" is the basemap's own font, so its glyphs (including Vietnamese) come from the same glyph server.
  map.addLayer({
    id: WARDS_LABELS_ID,
    type: "symbol",
    source,
    ...sourceLayer,
    metadata,
    minzoom: WARD_LABEL_MIN_ZOOM,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], WARD_LABEL_MIN_ZOOM, 11, 16, 14],
    },
    paint: {
      "text-color": entryColors("ward-names", root)[0]!,
      "text-halo-color": cssVarToRgba(cssVariableMap.background, root),
      "text-halo-width": 1.5,
    },
  });

  return map;
}

// After a failed load of the ward GeoJSON, so that selecting Wards again tries again from scratch.
export function removeWardsLayer(map: Map): Map {
  for (const id of [WARDS_LABELS_ID, WARDS_LINE_ID, WARDS_FILL_ID]) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(WARDS_SOURCE_ID)) map.removeSource(WARDS_SOURCE_ID);
  return map;
}
