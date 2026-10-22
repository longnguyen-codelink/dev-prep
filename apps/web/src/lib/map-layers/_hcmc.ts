import type { Map } from "maplibre-gl";

import { LAYER_GROUPS } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { entryColors, layerMetadata } from "@/lib/utils";

export function addHCMCLayer(map: Map): Map {
  const [color] = entryColors("city");

  map.addSource("hcmc", {
    type: "geojson",
    data: MAP_URLS.boundaryGeoJson,
  });

  map.addLayer({
    id: "hcmc",
    type: "line",
    source: "hcmc",
    metadata: layerMetadata(LAYER_GROUPS.BOUNDARY),
    paint: {
      "line-color": color,
      "line-width": 2,
    },
  });

  map.addLayer({
    id: "hcmc-fill",
    type: "fill",
    source: "hcmc",
    metadata: layerMetadata(LAYER_GROUPS.BOUNDARY),
    paint: {
      "fill-color": color,
      "fill-opacity": 0.1,
    },
  });

  return map;
}
