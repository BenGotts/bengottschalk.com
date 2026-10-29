import { eventResultType } from "./events";

// Barriers worth celebrating, in seconds for timed events and moves for FMC.
const TIME_BARRIERS = [600, 300, 240, 180, 120, 90, 60, 45, 30, 20, 15, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const MOVE_BARRIERS = [40, 35, 30, 25, 20];
// Blindfolded events, where any success is an achievement.
const BLINDFOLDED_EVENTS = new Set(["333bf", "444bf", "555bf", "333mbf", "333mbo"]);

function barrierLabel(barrier: number, resultType: "time" | "number"): string {
  if (resultType === "number" || barrier < 60) return `Sub-${barrier}`;
  const minutes = Math.floor(barrier / 60);
  const seconds = barrier % 60;
  return `Sub-${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * The milestone a PR reached, if any: the lowest barrier it broke that the
 * previous PR hadn't (e.g. "Sub-10", "Sub-1:00", "Sub-30" moves), or "First
 * success" for a first Blindfolded result. A first result in other events
 * starts the record rather than breaking one, so it has none. Multi-Blind's
 * encoded values have no barriers.
 */
export function milestone(eventId: string, kind: "single" | "average", previous: number | undefined, value: number): string | null {
  if (previous === undefined) return BLINDFOLDED_EVENTS.has(eventId) ? "First success" : null;
  const resultType = eventResultType(eventId);
  if (resultType === "multi") return null;

  // Times are centiseconds; FMC averages are moves × 100.
  const scale = resultType === "time" || kind === "average" ? 100 : 1;
  const barriers = resultType === "time" ? TIME_BARRIERS : MOVE_BARRIERS;
  const broken = barriers.filter((barrier) => value < barrier * scale && previous >= barrier * scale);
  return broken.length > 0 ? barrierLabel(broken.at(-1)!, resultType) : null;
}
