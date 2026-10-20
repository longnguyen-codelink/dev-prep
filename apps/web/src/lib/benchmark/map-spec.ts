import type { Map } from "maplibre-gl";
import { computed, onBeforeUnmount, ref, watch, type Ref } from "vue";

import { BENCHMARK_MAP_HEIGHT, BENCHMARK_MAP_WIDTH, START_CENTER, START_ZOOM } from "@/constants";

const startCenter = START_CENTER as [number, number];
const formatCenter = (lng: number, lat: number) => `${lng.toFixed(4)}, ${lat.toFixed(4)}`;

// Live facts about the map and the window, shared by the details section and the recommendations.
export function useMapSpec(map: Ref<Map | null>) {
  const live = ref({ width: 0, height: 0, zoom: 0, center: "", overlayLayers: [] as string[], basemapLayers: 0 });
  const win = ref({ width: window.innerWidth, height: window.innerHeight, ratio: window.devicePixelRatio });

  function refresh(target: Map) {
    const layers = target.getStyle()?.layers ?? [];
    const container = target.getContainer();
    const center = target.getCenter();
    const isOverlay = (layer: (typeof layers)[number]) => "source" in layer && layer.source === "roads";
    live.value = {
      width: container.clientWidth,
      height: container.clientHeight,
      zoom: target.getZoom(),
      center: formatCenter(center.lng, center.lat),
      overlayLayers: layers.filter(isOverlay).map((layer) => layer.id),
      basemapLayers: layers.filter((layer) => !isOverlay(layer)).length,
    };
  }

  let detach = () => {};
  watch(
    map,
    (target) => {
      detach();
      if (!target) return;
      const update = () => refresh(target);
      target.on("moveend", update);
      target.on("resize", update);
      target.on("idle", update);
      update();
      detach = () => {
        target.off("moveend", update);
        target.off("resize", update);
        target.off("idle", update);
      };
    },
    { immediate: true },
  );

  const onResize = () => (win.value = { width: window.innerWidth, height: window.innerHeight, ratio: window.devicePixelRatio });
  window.addEventListener("resize", onResize);
  onBeforeUnmount(() => {
    detach();
    window.removeEventListener("resize", onResize);
  });

  const sizeOk = computed(() => live.value.width === BENCHMARK_MAP_WIDTH && live.value.height === BENCHMARK_MAP_HEIGHT);
  const movedFromStart = computed(
    () =>
      live.value.width > 0 &&
      (Math.abs(live.value.zoom - START_ZOOM) > 0.01 || live.value.center !== formatCenter(startCenter[0], startCenter[1])),
  );

  return { live, win, sizeOk, movedFromStart, startCenter };
}

export type MapSpec = ReturnType<typeof useMapSpec>;
