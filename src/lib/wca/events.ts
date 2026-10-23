import { getEventName, getEventResultType, type EventId } from "@wca/helpers";

// Official events in WCA order, then retired events.
export const CURRENT_EVENT_IDS = [
  "333", "222", "444", "555", "666", "777", "333bf", "333fm", "333oh",
  "clock", "minx", "pyram", "skewb", "sq1", "444bf", "555bf", "333mbf", "fto",
] as const;
export const RETIRED_EVENT_IDS = ["333ft", "magic", "mmagic", "333mbo"] as const;

const EVENT_ORDER: readonly string[] = [...CURRENT_EVENT_IDS, ...RETIRED_EVENT_IDS];

// @wca/helpers 2.0.0 types include "fto" but its event table does not, so its
// lookups throw for FTO. Events missing there are described here instead.
const FALLBACK_EVENTS: Record<string, { name: string; resultType: ResultType }> = {
  fto: { name: "Face-Turning Octahedron", resultType: "time" },
};

export type ResultType = "time" | "number" | "multi";

export function isKnownEvent(eventId: string): eventId is EventId {
  return EVENT_ORDER.includes(eventId);
}

export function eventName(eventId: string): string {
  const fallback = FALLBACK_EVENTS[eventId];
  if (fallback) return fallback.name;
  if (!isKnownEvent(eventId)) return eventId;
  try {
    return getEventName(eventId);
  } catch {
    return eventId;
  }
}

export function eventResultType(eventId: string): ResultType {
  const fallback = FALLBACK_EVENTS[eventId];
  if (fallback) return fallback.resultType;
  if (!isKnownEvent(eventId)) return "time";
  try {
    return getEventResultType(eventId);
  } catch {
    return "time";
  }
}

/** Class names for the `@cubing/icons` font. */
export function eventIconClass(eventId: string): string {
  // @cubing/icons 3 only ships FTO as an unofficial icon.
  return eventId === "fto" ? "cubing-icon unofficial-fto" : `cubing-icon event-${eventId}`;
}

function eventRank(eventId: string): number {
  const index = EVENT_ORDER.indexOf(eventId);
  return index === -1 ? EVENT_ORDER.length : index;
}

/** Sorts event ids into WCA order; unknown ids go last, alphabetically. */
export function sortEventIds<T extends string>(eventIds: readonly T[]): T[] {
  return eventIds.toSorted((a, b) => eventRank(a) - eventRank(b) || a.localeCompare(b));
}
