import { CURRENT_EVENT_IDS, eventName } from "@bengottschalk/wca/events";

export type EventKind = "time" | "fewest-moves" | "multi-blind";

/**
 * How an event's results are averaged: an average of 5 (best and worst
 * dropped), a mean of 3, or "best" for an event judged on single results
 * only (Multi-Blind), which has no rolling average at all.
 */
export type EventFormat = "ao5" | "mo3" | "best";

export interface TimerEvent {
  id: string;
  name: string;
  /** A short label for menus, like "3×3" or "3BLD". */
  shortName: string;
  kind: EventKind;
  format: EventFormat;
  /** WCA inspection: 15 seconds, except blindfolded events and FMC. */
  inspection: boolean;
  blindfolded: boolean;
  /** The id `cubing.js` makes scrambles for. */
  scrambleId: string;
  /** The puzzle `cubing.js` draws the scramble on, if it can. */
  puzzleId: string | null;
}

const SHORT_NAMES: Record<string, string> = {
  "333": "3×3", "222": "2×2", "444": "4×4", "555": "5×5", "666": "6×6", "777": "7×7",
  "333bf": "3BLD", "333fm": "FMC", "333oh": "OH", clock: "Clock", minx: "Megaminx",
  pyram: "Pyraminx", skewb: "Skewb", sq1: "Square-1", "444bf": "4BLD", "555bf": "5BLD",
  "333mbf": "Multi-BLD", fto: "FTO",
};

const PUZZLES: Record<string, string> = {
  "333": "3x3x3", "222": "2x2x2", "444": "4x4x4", "555": "5x5x5", "666": "6x6x6", "777": "7x7x7",
  "333bf": "3x3x3", "333fm": "3x3x3", "333oh": "3x3x3", clock: "clock", minx: "megaminx",
  pyram: "pyraminx", skewb: "skewb", sq1: "square1", "444bf": "4x4x4", "555bf": "5x5x5",
  "333mbf": "3x3x3", fto: "fto",
};

/**
 * Mean-of-3 events: the long ones (6×6, 7×7, 4BLD, 5BLD) and FMC. 3BLD is
 * averaged over five like the other speed events (as cubers and the WCA
 * now rank it); Multi-Blind is single results only.
 */
const MEAN_OF_3 = new Set(["666", "777", "333fm", "444bf", "555bf"]);
const SINGLE_ONLY = new Set(["333mbf"]);

function describe(id: string): TimerEvent {
  const blindfolded = id.endsWith("bf");
  return {
    id,
    name: eventName(id),
    shortName: SHORT_NAMES[id] ?? id,
    kind: id === "333fm" ? "fewest-moves" : id === "333mbf" ? "multi-blind" : "time",
    format: SINGLE_ONLY.has(id) ? "best" : MEAN_OF_3.has(id) ? "mo3" : "ao5",
    inspection: !blindfolded && id !== "333fm",
    blindfolded,
    scrambleId: id,
    puzzleId: PUZZLES[id] ?? null,
  };
}

/** Every current WCA event, in WCA order. */
export const TIMER_EVENTS: readonly TimerEvent[] = CURRENT_EVENT_IDS.map(describe);

const BY_ID = new Map(TIMER_EVENTS.map((event) => [event.id, event]));

export function timerEvent(id: string): TimerEvent {
  return BY_ID.get(id) ?? describe(id);
}

export function isTimerEvent(id: string): boolean {
  return BY_ID.has(id);
}

/** The average an event format leads with (the solve list's running column): mo3, ao5, or none for single-result events. */
export function formatAverageSpec(format: EventFormat): { kind: "mean" | "average"; size: number } | null {
  if (format === "mo3") return { kind: "mean", size: 3 };
  if (format === "ao5") return { kind: "average", size: 5 };
  return null;
}
