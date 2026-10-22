import type { Map } from "maplibre-gl";

import { cssVariableMap, LAYER_GROUPS, WARD_LABEL_MIN_ZOOM, WARD_OUTLINE_MIN_ZOOM } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba } from "@/lib/utils";

import { firstLayerOf, layerMetadata } from "./_groups";

export const WARDS_SOURCE_ID = "wards";
const WARDS_LINE_ID = "wards-line";
const WARDS_LABELS_ID = "wards-labels";

// The ward file (about 1 MB) is only requested when this is called, i.e. when the Wards group is first switched on.
// The outline goes below the roads so road lines stay on top of it; the names go on top so roads do not cross them.
export function addWardsLayer(map: Map): Map {
  const root = document.documentElement;
  const metadata = layerMetadata(LAYER_GROUPS.WARDS);

  map.addSource(WARDS_SOURCE_ID, { type: "geojson", data: MAP_URLS.wardsGeoJson });

  map.addLayer(
    {
      id: WARDS_LINE_ID,
      type: "line",
      source: WARDS_SOURCE_ID,
      metadata,
      minzoom: WARD_OUTLINE_MIN_ZOOM,
      paint: {
        "line-color": cssVarToRgba(cssVariableMap.chart4, root),
        "line-width": ["interpolate", ["linear"], ["zoom"], WARD_OUTLINE_MIN_ZOOM, 0.5, 16, 1.5],
      },
    },
    firstLayerOf(map, LAYER_GROUPS.ROADS),
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
  for (const id of [WARDS_LABELS_ID, WARDS_LINE_ID]) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(WARDS_SOURCE_ID)) map.removeSource(WARDS_SOURCE_ID);
  return map;
}
