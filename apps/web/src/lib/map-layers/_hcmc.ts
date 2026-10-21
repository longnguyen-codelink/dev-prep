import type { Map } from "maplibre-gl";

import { cssVariableMap } from "@/constants";
import { MAP_URLS } from "@/constants/endpoints";
import { cssVarToRgba } from "@/lib/utils";

export function addHCMCLayer(map: Map): Map {
  map.addSource("hcmc", {
    type: "geojson",
    data: MAP_URLS.boundaryGeoJson,
  });

  map.addLayer({
    id: "hcmc",
    type: "line",
    source: "hcmc",
    paint: {
      "line-color": cssVarToRgba(cssVariableMap.chart1, document.documentElement),
      "line-width": 2,
    },
  });

  map.addLayer({
    id: "hcmc-fill",
    type: "fill",
    source: "hcmc",
    paint: {
      "fill-color": cssVarToRgba(cssVariableMap.chart1, document.documentElement),
      "fill-opacity": 0.1,
    },
  });

  return map;
}
