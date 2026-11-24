import type { Precision } from "@bengottschalk/timer-core/time";

export interface Settings {
  /** How times are shown. They're always saved to the thousandth. */
  precision: Precision;
  /** WCA inspection for events that have it. */
  inspection: boolean;
  /** Say "8 seconds" and "12 seconds" during inspection. */
  inspectionVoice: boolean;
  /** How long to hold before the timer turns green, in ms. */
  holdMs: number;
  /** Show "solving" instead of the running time. */
  hideRunningTime: boolean;
  /** Time with the timer, or type times in. */
  entry: "timer" | "typing";
  /** Blindfolded: the first press while solving marks the end of memo. */
  bldMemoSplit: boolean;
  showScrambleImage: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  precision: "hundredths",
  inspection: true,
  inspectionVoice: true,
  holdMs: 300,
  hideRunningTime: false,
  entry: "timer",
  bldMemoSplit: false,
  showScrambleImage: true,
};
