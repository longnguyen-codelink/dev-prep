import { type Map, type MapGeoJSONFeature, type MapMouseEvent, Popup } from "maplibre-gl";

// A line of popup text. Built with textContent because the text comes from data, never as HTML.
export function popupLine(className: string, text: string): HTMLElement {
  const line = document.createElement("div");
  line.className = className;
  line.textContent = text;
  return line;
}

// A group of clickable features. `layers()` returns the layer ids that currently exist; an empty array means inactive.
export type PopupSource = {
  id: string;
  priority: number;
  tolerancePx: number;
  layers: () => string[];
  content: (properties: Record<string, unknown>) => HTMLElement;
};

// One popup per map, moved to each clicked feature. closeOnClick is off: MapLibre's close listener runs on every click,
// including feature clicks, and would close the popup it was just moved to. The click on empty map closes it instead.
export function createMapPopups(map: Map) {
  const popup = new Popup({ closeButton: true, closeOnClick: false, maxWidth: "240px", offset: 8 });
  const sources = new globalThis.Map<string, PopupSource>();
  let openId: string | null = null;

  // The highest-priority source with a hit under the pointer wins; later sources are not queried.
  function hitAt(event: MapMouseEvent): { source: PopupSource; feature: MapGeoJSONFeature } | null {
    const { x, y } = event.point;
    const byPriority = [...sources.values()].sort((a, b) => b.priority - a.priority);
    for (const source of byPriority) {
      const layers = source.layers();
      if (layers.length === 0) continue;
      const r = source.tolerancePx;
      const [feature] = map.queryRenderedFeatures(
        [
          [x - r, y - r],
          [x + r, y + r],
        ],
        { layers },
      );
      if (feature) return { source, feature };
    }
    return null;
  }

  function close(id?: string) {
    if (id !== undefined && openId !== id) return;
    popup.remove();
    openId = null;
  }

  map.on("click", (event) => {
    const hit = hitAt(event);
    if (!hit) {
      close();
      return;
    }
    popup.setLngLat(event.lngLat).setDOMContent(hit.source.content(hit.feature.properties)).addTo(map);
    openId = hit.source.id;
  });

  // Empty string gives back the cursor from the stylesheet (MapLibre's grab cursor) rather than forcing an arrow.
  map.on("mousemove", (event) => {
    map.getCanvas().style.cursor = hitAt(event) ? "pointer" : "";
  });

  return {
    add(source: PopupSource) {
      sources.set(source.id, source);
    },
    remove(id: string) {
      close(id);
      sources.delete(id);
    },
    close,
  };
}
