import type { Mode } from "@/constants";

export type Props = {
  mode: Mode;
  busy: boolean;
  switchMode: (mode: Mode) => void;
};
