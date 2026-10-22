import type { TileMode } from "@/constants";

export type Props = {
  mode: TileMode;
  busy: boolean;
  isHidden?: boolean;
  switchMode: (mode: TileMode) => void;
};
