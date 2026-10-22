import type { Map } from "maplibre-gl";

import { cssVariableMap, LAYER_GROUPS, WARD_LABEL_MIN_ZOOM, WARD_OUTLINE_MIN_ZOOM } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba } from "@/lib/utils";

import { firstLayerOf, layerMetadata } from "./_groups";

export const WARDS_SOURCE_ID = "wards";
const WARDS_FILL_ID = "wards-fill";
const WARDS_LINE_ID = "wards-line";
const WARDS_LABELS_ID = "wards-labels";

// The ward file (about 1 MB) is only requested when this is called, i.e. when the Wards group is first switched on.
// The fill and outline go below the roads so road lines stay on top of them; the names go on top so roads do not cross them.
export function addWardsLayer(map: Map): Map {
  const root = document.documentElement;
  const metadata = layerMetadata(LAYER_GROUPS.WARDS);

  map.addSource(WARDS_SOURCE_ID, { type: "geojson", data: MAP_URLS.wardsGeoJson });

  // Each ward is tinted with one of the five chart colours, picked from its OSM id, so neighbouring wards are mostly
  // told apart. The colour is not coordinated between neighbours: two adjacent wards can get the same tint.
  const roadsId = firstLayerOf(map, LAYER_GROUPS.ROADS);
  const [tint0, tint1, tint2, tint3, tint4] = [cssVariableMap.chart1, cssVariableMap.chart2, cssVariableMap.chart3, cssVariableMap.chart4, cssVariableMap.chart5].map((name) =>
    cssVarToRgba(name, root),
  );
  map.addLayer(
    {
      id: WARDS_FILL_ID,
      type: "fill",
      source: WARDS_SOURCE_ID,
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
      source: WARDS_SOURCE_ID,
      metadata,
      minzoom: WARD_OUTLINE_MIN_ZOOM,
      paint: {
        // Dashed and dark: the chart colours blend into the basemap's yellow roads and the overlay roads.
        "line-color": cssVarToRgba(cssVariableMap.foreground, root),
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
    source: WARDS_SOURCE_ID,
    metadata,
    minzoom: WARD_LABEL_MIN_ZOOM,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], WARD_LABEL_MIN_ZOOM, 11, 16, 14],
    },
    paint: {
      "text-color": cssVarToRgba(cssVariableMap.foreground, root),
      "text-halo-color": cssVarToRgba(cssVariableMap.background, root),
      "text-halo-width": 1.5,
    },
  });

  return map;
}

// After a failed load, so that selecting Wards again tries again from scratch.
export function removeWardsLayer(map: Map): Map {
  for (const id of [WARDS_LABELS_ID, WARDS_LINE_ID, WARDS_FILL_ID]) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(WARDS_SOURCE_ID)) map.removeSource(WARDS_SOURCE_ID);
  return map;
}
