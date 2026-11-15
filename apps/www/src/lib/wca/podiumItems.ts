import { eventIconClass, eventName, isCurrentEvent, sortEventIds } from "./events";
import { formatResult } from "./format";
import type { Medal, Podium } from "./stats";

/** One podium, formatted on the server so the browser only renders it. */
export interface PodiumItem {
  key: string;
  medal: Medal;
  eventName: string;
  iconClass: string;
  /** The result that placed: the average, or the single for best-of rounds. */
  value: string;
  kind: "single" | "average";
  /** The event's results page; null for retired events, which have none. */
  href: string | null;
}

// Average formats (Ao5, Mo3) rank by the average; best-of formats, and rounds
// without a valid average, by the single.
const AVERAGE_FORMATS = new Set(["a", "m"]);
const MEDAL_ORDER: Medal[] = ["gold", "silver", "bronze"];

/** One competition's podiums, golds first, then by event. */
export function podiumItems(podiums: Podium[]): PodiumItem[] {
  const eventOrder = sortEventIds(podiums.map((podium) => podium.result.event_id));
  return podiums
    .toSorted(
      (a, b) => MEDAL_ORDER.indexOf(a.medal) - MEDAL_ORDER.indexOf(b.medal) || eventOrder.indexOf(a.result.event_id) - eventOrder.indexOf(b.result.event_id),
    )
    .map(({ medal, result }) => {
      const kind = AVERAGE_FORMATS.has(result.format_id) && result.average > 0 ? "average" : "single";
      return {
        key: String(result.id),
        medal,
        eventName: eventName(result.event_id),
        iconClass: eventIconClass(result.event_id),
        value: formatResult(result.event_id, kind === "average" ? result.average : result.best, kind),
        kind,
        href: isCurrentEvent(result.event_id) ? `/cubing/results/${result.event_id}` : null,
      };
    });
}
