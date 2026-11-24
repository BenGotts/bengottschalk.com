import { CURRENT_EVENT_IDS, eventName } from "@bengottschalk/wca/events";

export type EventKind = "time" | "fewest-moves" | "multi-blind";

/** The average an event is judged on: average of 5 or mean of 3 (Multi-Blind has none). */
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

const MEAN_OF_3 = new Set(["666", "777", "333bf", "333fm", "444bf", "555bf"]);

function describe(id: string): TimerEvent {
  const blindfolded = id.endsWith("bf");
  return {
    id,
    name: eventName(id),
    shortName: SHORT_NAMES[id] ?? id,
    kind: id === "333fm" ? "fewest-moves" : id === "333mbf" ? "multi-blind" : "time",
    format: id === "333mbf" ? "best" : MEAN_OF_3.has(id) ? "mo3" : "ao5",
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
