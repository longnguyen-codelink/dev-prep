import type { LayerGroup } from "@/constants";

export type Props = {
  layers: readonly LayerGroup[];
  switchLayers: (layers: LayerGroup[]) => void;
};
