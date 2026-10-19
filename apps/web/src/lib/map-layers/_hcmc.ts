import type { Map } from "maplibre-gl";

import { cssVariableMap, HCMC_URL } from "@/constants";
import { cssVarToRgba } from "@/lib/utils";

export function addHCMCLayer(map: Map): Map {
  map.addSource("hcmc", {
    type: "geojson",
    data: HCMC_URL,
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
