import type { Map } from "maplibre-gl";

import { DEFAULT_LAYER_GROUPS, LAYER_GROUPS, type LayerGroup, UNAVAILABLE_LAYER_GROUPS } from "@/constants";

// Put in a layer's `metadata` when it is added; applyVisibility() finds the layers of a group through it,
// so no layer id is listed anywhere (the road layer ids differ between the GeoJSON and tile modes).
export const layerMetadata = (group: LayerGroup) => ({ group });

function groupOf(metadata: unknown): LayerGroup | undefined {
  if (typeof metadata !== "object" || metadata === null || !("group" in metadata)) return undefined;
  return metadata.group as LayerGroup;
}

// Shows the layers of the enabled groups and hides the other overlay layers; basemap layers have no group and are left alone.
export function applyVisibility(map: Map, enabled: readonly LayerGroup[]): void {
  for (const layer of map.getStyle().layers) {
    const group = groupOf(layer.metadata);
    if (group) map.setLayoutProperty(layer.id, "visibility", enabled.includes(group) ? "visible" : "none");
  }
}

const ALL_GROUPS = Object.values(LAYER_GROUPS);

// "-roads,+wards" -> the defaults without roads and with wards. Only the difference from the defaults is in the URL, so a
// link without the parameter shows the default view. A token without "-" adds (a raw "+" in a URL arrives as a space).
export function parseLayersParam(value: string | null): LayerGroup[] {
  const enabled = new Set(DEFAULT_LAYER_GROUPS);
  for (const token of (value ?? "").split(",")) {
    const group = token.trim().replace(/^[-+]/, "") as LayerGroup;
    if (!ALL_GROUPS.includes(group)) continue;
    if (token.trim().startsWith("-")) enabled.delete(group);
    else if (!UNAVAILABLE_LAYER_GROUPS.includes(group)) enabled.add(group);
  }
  return ALL_GROUPS.filter((group) => enabled.has(group));
}

// The reverse of parseLayersParam; null when the selection equals the defaults (the parameter is then left out).
export function toLayersParam(enabled: readonly LayerGroup[]): string | null {
  const changes = ALL_GROUPS.flatMap((group) => {
    const isDefault = DEFAULT_LAYER_GROUPS.includes(group);
    if (isDefault && !enabled.includes(group)) return [`-${group}`];
    if (!isDefault && enabled.includes(group)) return [`+${group}`];
    return [];
  });
  return changes.length > 0 ? changes.join(",") : null;
}
