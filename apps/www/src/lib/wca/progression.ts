import { milestone } from "./milestones";
import type { PersonResult } from "./schemas";

export interface PrPoint {
  value: number;
  date: string;
  competitionId: string;
  competitionName: string;
  /** "NR", "CR" or "WR" (or a continental code like "NAR") when the PR was also a record. */
  record?: string;
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
    const point = (value: number, record: string | null): PrPoint => ({
      value,
      date: result.competition_start_date,
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
      ...(record && { record }),
    });
    const bestSingle = single.at(-1)?.value;
    if (result.best > 0 && (bestSingle === undefined || result.best < bestSingle)) {
      single.push(point(result.best, result.regional_single_record));
    }
    const bestAverage = average.at(-1)?.value;
    if (result.average > 0 && (bestAverage === undefined || result.average < bestAverage)) {
      average.push(point(result.average, result.regional_average_record));
    }
  }
  return { single, average };
}

export interface TimelinePr {
  eventId: string;
  kind: "single" | "average";
  value: number;
  /** The record it beat; absent for the first result in that event. */
  previous?: number;
  /** "NR", "CR", "WR" etc. when the PR was also a regional record. */
  record?: string;
  /** A barrier it broke, e.g. "Sub-10", or "First success" in Blindfolded. */
  milestone?: string;
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
          if (point.record) existing.record = point.record;
          const reached = milestone(eventId, kind, existing.previous, point.value);
          if (reached) existing.milestone = reached;
        } else {
          const reached = milestone(eventId, kind, previous, point.value);
          const pr: TimelinePr = {
            eventId,
            kind,
            value: point.value,
            ...(previous !== undefined && { previous }),
            ...(point.record && { record: point.record }),
            ...(reached && { milestone: reached }),
          };
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

export interface StreakCompetition {
  competitionId: string;
  competitionName: string;
  date: string;
}

export interface PrStreaks {
  /** PR competitions in a row up to the latest competition (0 if it had no PR). */
  current: number;
  /** The longest run (the earliest, if tied), or null without any PR. */
  longest: { length: number; from: StreakCompetition; to: StreakCompetition } | null;
}

/**
 * Runs of consecutive competitions where at least one PR was set. Every
 * competition with results counts, so one without a PR ends the run.
 */
export function prStreaks(results: PersonResult[], timeline: TimelineEntry[]): PrStreaks {
  const withPrs = new Set(timeline.map((entry) => entry.competitionId));
  const competitions = [
    ...new Map(
      results.map((result) => [
        result.competition_id,
        { competitionId: result.competition_id, competitionName: result.competition_short_name, date: result.competition_start_date },
      ]),
    ).values(),
  ].toSorted((a, b) => a.date.localeCompare(b.date) || a.competitionId.localeCompare(b.competitionId));

  let run = 0;
  let longest: PrStreaks["longest"] = null;
  competitions.forEach((competition, index) => {
    run = withPrs.has(competition.competitionId) ? run + 1 : 0;
    if (run > 0 && run > (longest?.length ?? 0)) {
      longest = { length: run, from: competitions[index - run + 1], to: competition };
    }
  });
  return { current: run, longest };
}

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);

export interface PrDroughts {
  /** Days from the latest PR competition to `today`. */
  daysSinceLast: number;
  last: StreakCompetition;
  /** The longest gap between two competitions with PRs (the earliest, if tied). */
  longest: { days: number; from: StreakCompetition; to: StreakCompetition } | null;
}

/** Gaps between PRs in any event, measured between competition start dates. */
export function prDroughts(timeline: TimelineEntry[], today: string): PrDroughts | null {
  const oldestFirst = timeline.toReversed().map(({ competitionId, competitionName, date }) => ({ competitionId, competitionName, date }));
  const last = oldestFirst.at(-1);
  if (!last) return null;
  let longest: PrDroughts["longest"] = null;
  for (let index = 1; index < oldestFirst.length; index++) {
    const days = daysBetween(oldestFirst[index - 1].date, oldestFirst[index].date);
    if (!longest || days > longest.days) longest = { days, from: oldestFirst[index - 1], to: oldestFirst[index] };
  }
  return { daysSinceLast: Math.max(0, daysBetween(last.date, today)), last, longest };
}
