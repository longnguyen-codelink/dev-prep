import type { Map } from "maplibre-gl";

import { cssVariableMap, LAYER_GROUPS, POI_CLICK_TOLERANCE_PX, POI_LABEL_MIN_ZOOM, POI_POINT_MIN_ZOOM } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba, entryColors, layerMetadata } from "@/lib/utils";

import { type createMapPopups, popupLine } from "./_popups";

export const POI_SOURCE_ID = "poi";
export const POI_POINTS_ID = "poi-points";
const POI_LABELS_ID = "poi-labels";

// Popup body. Built only with createElement and textContent (never innerHTML, never HTML strings).
function poiPopupContent(properties: Record<string, unknown>): HTMLElement {
  const name = typeof properties.name === "string" ? properties.name.trim() : "";
  const kind = typeof properties.kind === "string" ? properties.kind.replace(/_/g, " ").trim() : "";
  const nameEn = typeof properties.name_en === "string" ? properties.name_en.trim() : "";
  const street = typeof properties.street === "string" ? properties.street.trim() : "";
  const rawWebsite = typeof properties.website === "string" ? properties.website.trim() : "";

  const content = document.createElement("div");
  content.append(popupLine("font-semibold", name));
  if (kind) content.append(popupLine("text-xs text-muted-foreground", kind));
  if (nameEn && nameEn !== name) content.append(popupLine("text-xs text-muted-foreground", nameEn));
  if (street) content.append(popupLine("text-xs text-muted-foreground", street));

  if (rawWebsite) {
    try {
      const url = new URL(rawWebsite);
      if (url.protocol === "http:" || url.protocol === "https:") {
        const linkWrapper = document.createElement("div");
        linkWrapper.className = "text-xs";
        const link = document.createElement("a");
        link.className = "underline hover:text-foreground";
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = url.hostname;
        linkWrapper.append(link);
        content.append(linkWrapper);
      }
    } catch {
      // Malformed URL, not shown.
    }
  }

  return content;
}

// Called when the Landmarks group is first switched on. Data is requested directly as GeoJSON (outside the benchmark).
export function addPoiLayer(map: Map, popups: ReturnType<typeof createMapPopups>): Map {
  const root = document.documentElement;
  const metadata = layerMetadata(LAYER_GROUPS.POI);

  map.addSource(POI_SOURCE_ID, {
    type: "geojson",
    data: MAP_URLS.poiGeoJson,
  });

  map.addLayer({
    id: POI_POINTS_ID,
    type: "circle",
    source: POI_SOURCE_ID,
    metadata,
    minzoom: POI_POINT_MIN_ZOOM,
    paint: {
      "circle-radius": 5,
      "circle-color": entryColors("poi-points", root)[0]!,
      "circle-stroke-color": cssVarToRgba(cssVariableMap.background, root),
      "circle-stroke-width": 1.5,
    },
  });

  map.addLayer({
    id: POI_LABELS_ID,
    type: "symbol",
    source: POI_SOURCE_ID,
    metadata,
    minzoom: POI_LABEL_MIN_ZOOM,
    layout: {
      "text-field": ["get", "name"],
      "text-font": ["Noto Sans Regular"],
      "text-size": ["interpolate", ["linear"], ["zoom"], POI_LABEL_MIN_ZOOM, 11, 16, 14],
      "text-offset": [0, 0.8],
      "text-anchor": "top",
    },
    paint: {
      "text-color": entryColors("poi-names", root)[0]!,
      "text-halo-color": cssVarToRgba(cssVariableMap.background, root),
      "text-halo-width": 1.5,
    },
  });

  popups.add({
    id: "poi",
    priority: 1,
    tolerancePx: POI_CLICK_TOLERANCE_PX,
    layers: () => (map.getLayer(POI_POINTS_ID) ? [POI_POINTS_ID] : []),
    content: poiPopupContent,
  });

  return map;
}

// After a failed load of the POI GeoJSON or when removing the layer.
export function removePoiLayer(map: Map, popups: ReturnType<typeof createMapPopups>): Map {
  popups.remove("poi");
  for (const id of [POI_LABELS_ID, POI_POINTS_ID]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(POI_SOURCE_ID)) map.removeSource(POI_SOURCE_ID);
  return map;
}
