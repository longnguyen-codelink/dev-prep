import { type Map, type MapGeoJSONFeature, type MapMouseEvent, type PointLike, Popup } from "maplibre-gl";

import { cssVariableMap, LAYER_GROUPS, POI_LABEL_MIN_ZOOM, POI_POINT_MIN_ZOOM } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba, entryColors, layerMetadata } from "@/lib/utils";

export const POI_SOURCE_ID = "poi";
export const POI_POINTS_ID = "poi-points";
const POI_LABELS_ID = "poi-labels";

let poiPopup: Popup | null = null;
let clickListener: ((event: MapMouseEvent) => void) | null = null;

export function closePoiPopup(): void {
  poiPopup?.remove();
}

// The rendered POI features at a pixel; empty array when the layer does not exist yet.
export function poiAt(map: Map, point: PointLike): MapGeoJSONFeature[] {
  if (!map.getLayer(POI_POINTS_ID)) return [];
  return map.queryRenderedFeatures(point, { layers: [POI_POINTS_ID] });
}

// Popup body. Built only with createElement and textContent (never innerHTML, never HTML strings).
function poiPopupContent(properties: Record<string, unknown>): HTMLElement {
  const name = typeof properties.name === "string" ? properties.name.trim() : "";
  const kind = typeof properties.kind === "string" ? properties.kind.replace(/_/g, " ").trim() : "";
  const nameEn = typeof properties.name_en === "string" ? properties.name_en.trim() : "";
  const street = typeof properties.street === "string" ? properties.street.trim() : "";
  const rawWebsite = typeof properties.website === "string" ? properties.website.trim() : "";

  const content = document.createElement("div");

  const title = document.createElement("div");
  title.className = "font-semibold";
  title.textContent = name;
  content.append(title);

  if (kind) {
    const kindEl = document.createElement("div");
    kindEl.className = "text-xs text-muted-foreground";
    kindEl.textContent = kind;
    content.append(kindEl);
  }

  if (nameEn && nameEn !== name) {
    const enEl = document.createElement("div");
    enEl.className = "text-xs text-muted-foreground";
    enEl.textContent = nameEn;
    content.append(enEl);
  }

  if (street) {
    const streetEl = document.createElement("div");
    streetEl.className = "text-xs text-muted-foreground";
    streetEl.textContent = street;
    content.append(streetEl);
  }

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
export function addPoiLayer(map: Map): Map {
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

  if (!poiPopup) {
    poiPopup = new Popup({ closeButton: true, closeOnClick: false, maxWidth: "240px", offset: 8 });
  }

  if (clickListener) {
    map.off("click", clickListener);
  }
  clickListener = (event) => {
    const [feature] = poiAt(map, event.point);
    if (!feature) {
      closePoiPopup();
      return;
    }
    poiPopup!
      .setLngLat(event.lngLat)
      .setDOMContent(poiPopupContent(feature.properties as Record<string, unknown>))
      .addTo(map);
  };
  map.on("click", clickListener);

  return map;
}

// After a failed load of the POI GeoJSON or when removing the layer.
export function removePoiLayer(map: Map): Map {
  closePoiPopup();
  if (clickListener) {
    map.off("click", clickListener);
    clickListener = null;
  }
  for (const id of [POI_LABELS_ID, POI_POINTS_ID]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  if (map.getSource(POI_SOURCE_ID)) map.removeSource(POI_SOURCE_ID);
  return map;
}
