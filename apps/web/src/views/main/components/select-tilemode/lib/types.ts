import type { TileMode } from "@/constants";

export type Props = {
  mode: TileMode;
  busy: boolean;
  isDisabled?: boolean;
  switchMode: (mode: TileMode) => void;
};
