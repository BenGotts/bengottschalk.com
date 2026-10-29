import type { PersonResult } from "./schemas";

export interface PrPoint {
  value: number;
  date: string;
  competitionId: string;
  competitionName: string;
}

export interface Progression {
  single: PrPoint[];
  average: PrPoint[];
}

// Order of rounds within a competition (WCA round_type_id).
const ROUND_ORDER: Record<string, number> = {
  "0": 0, h: 0, "1": 1, d: 1, "2": 2, e: 2, "3": 3, g: 3, b: 3, c: 4, f: 4,
};

function chronological(a: PersonResult, b: PersonResult): number {
  return (
    a.competition_start_date.localeCompare(b.competition_start_date) ||
    a.competition_id.localeCompare(b.competition_id) ||
    (ROUND_ORDER[a.round_type_id] ?? 2) - (ROUND_ORDER[b.round_type_id] ?? 2)
  );
}

/**
 * Each time the person set a new personal record, oldest first. Lower values
 * are better for every event, including Multi-Blind's encoding. Values ≤ 0
 * (no result, DNF, DNS) never count.
 */
export function prProgression(results: PersonResult[]): Progression {
  const single: PrPoint[] = [];
  const average: PrPoint[] = [];
  for (const result of results.toSorted(chronological)) {
    const point = (value: number): PrPoint => ({
      value,
      date: result.competition_start_date,
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
    });
    const bestSingle = single.at(-1)?.value;
    if (result.best > 0 && (bestSingle === undefined || result.best < bestSingle)) single.push(point(result.best));
    const bestAverage = average.at(-1)?.value;
    if (result.average > 0 && (bestAverage === undefined || result.average < bestAverage)) average.push(point(result.average));
  }
  return { single, average };
}

export interface TimelinePr {
  eventId: string;
  kind: "single" | "average";
  value: number;
  /** The record it beat; absent for the first result in that event. */
  previous?: number;
}

export interface TimelineEntry {
  competitionId: string;
  competitionName: string;
  date: string;
  prs: TimelinePr[];
}

/**
 * Every personal record across all events, grouped by the competition where
 * it was set, newest competition first. Within a competition, PRs follow
 * `eventOrder` (singles before averages); a PR improved twice there (say in
 * round 1 and the final) is listed once, at its best, against the record it
 * started from.
 */
export function prTimeline(results: PersonResult[], eventOrder: (eventIds: string[]) => string[]): TimelineEntry[] {
  const byEvent = Map.groupBy(results, (result) => result.event_id);
  const entries = new Map<string, TimelineEntry>();
  const prsAt = new Map<string, TimelinePr>();

  for (const [eventId, eventResults] of byEvent) {
    const progression = prProgression(eventResults);
    for (const kind of ["single", "average"] as const) {
      let previous: number | undefined;
      for (const point of progression[kind]) {
        const entry = entries.get(point.competitionId) ?? {
          competitionId: point.competitionId,
          competitionName: point.competitionName,
          date: point.date,
          prs: [],
        };
        entries.set(point.competitionId, entry);
        const key = `${point.competitionId}|${eventId}|${kind}`;
        const existing = prsAt.get(key);
        if (existing) {
          existing.value = point.value;
        } else {
          const pr: TimelinePr = { eventId, kind, value: point.value, ...(previous !== undefined && { previous }) };
          prsAt.set(key, pr);
          entry.prs.push(pr);
        }
        previous = point.value;
      }
    }
  }

  for (const entry of entries.values()) {
    const order = eventOrder([...new Set(entry.prs.map((pr) => pr.eventId))]);
    entry.prs.sort((a, b) => order.indexOf(a.eventId) - order.indexOf(b.eventId) || (a.kind === "single" ? -1 : 1));
  }
  return [...entries.values()].toSorted(
    (a, b) => b.date.localeCompare(a.date) || b.competitionId.localeCompare(a.competitionId),
  );
}
