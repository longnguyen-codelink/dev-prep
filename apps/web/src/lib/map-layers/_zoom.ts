import type { Map } from "maplibre-gl";
import { onBeforeUnmount, ref, watch, type Ref } from "vue";

import { START_ZOOM } from "@/constants";

// The map's current zoom, kept up to date while it zooms (animations and pinches included).
export function useMapZoom(map: Ref<Map | null>): Ref<number> {
  const zoom = ref<number>(START_ZOOM);

  let detach = () => {};
  watch(
    map,
    (target) => {
      detach();
      if (!target) return;
      const update = () => (zoom.value = target.getZoom());
      target.on("zoom", update);
      update();
      detach = () => target.off("zoom", update);
    },
    { immediate: true },
  );
  onBeforeUnmount(() => detach());

  return zoom;
}
