import { eventIconClass, eventName, formatResult, isCurrentEvent, sortEventIds, type Medal, type Podium } from "@/lib/wca";

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

export interface PodiumRow {
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  year: string;
  medals: PodiumItem[];
}

// Average formats (Ao5, Mo3) rank by the average; best-of formats, and rounds
// without a valid average, by the single.
const AVERAGE_FORMATS = new Set(["a", "m"]);
const MEDAL_ORDER: Medal[] = ["gold", "silver", "bronze"];

/**
 * Podiums grouped by competition, newest first, formatted on the server so the
 * browser only renders them. Within a competition: golds first, then by event.
 */
export function podiumRows(podiums: Podium[], dateLabel: (competitionId: string, startDate: string) => string): PodiumRow[] {
  const rows = new Map<string, PodiumRow & { podiums: Podium[] }>();
  for (const podium of podiums) {
    const { result } = podium;
    const row = rows.get(result.competition_id) ?? {
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
      dateLabel: dateLabel(result.competition_id, result.competition_start_date),
      year: result.competition_start_date.slice(0, 4),
      medals: [],
      podiums: [],
    };
    row.podiums.push(podium);
    rows.set(result.competition_id, row);
  }

  return [...rows.values()].map(({ podiums: list, ...row }) => {
    const eventOrder = sortEventIds(list.map((podium) => podium.result.event_id));
    const sorted = list.toSorted(
      (a, b) => MEDAL_ORDER.indexOf(a.medal) - MEDAL_ORDER.indexOf(b.medal) || eventOrder.indexOf(a.result.event_id) - eventOrder.indexOf(b.result.event_id),
    );
    return {
      ...row,
      medals: sorted.map(({ medal, result }) => {
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
      }),
    };
  });
}
