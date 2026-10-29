import { historyStats, type HistoryEntry, type HistoryStats } from "./competitions";
import { isCurrentEvent } from "./events";
import type { Person, PersonResult } from "./schemas";

export interface CubingStats extends HistoryStats {
  medals: Person["medals"];
  records: Person["records"];
}

/**
 * The headline numbers shown on the home page and the Cubing pages. Counts of
 * competitions come from the finished history, so they agree with the history
 * list; medals and records come from the WCA profile.
 */
export function cubingStats(person: Person, history: HistoryEntry[]): CubingStats {
  return { ...historyStats(history), medals: person.medals, records: person.records };
}

// Final rounds: "f" (final) and "c" (combined final).
const FINAL_ROUNDS = new Set(["f", "c"]);

export type Medal = "gold" | "silver" | "bronze";
const MEDALS: Medal[] = ["gold", "silver", "bronze"];

export interface Podium {
  medal: Medal;
  result: PersonResult;
}

/**
 * Top-three finishes in a final with a valid result, which is how the WCA
 * counts medals. Newest competition first.
 */
export function podiums(results: PersonResult[]): Podium[] {
  return results
    .filter((result) => FINAL_ROUNDS.has(result.round_type_id) && result.pos >= 1 && result.pos <= 3 && result.best > 0)
    .toSorted((a, b) => b.competition_start_date.localeCompare(a.competition_start_date) || a.pos - b.pos)
    .map((result) => ({ medal: MEDALS[result.pos - 1], result }));
}

/**
 * Events to feature: 3x3 first when there's a result, then the current events
 * whose single has the best world rank.
 */
export function highlightEvents(records: Person["personal_records"], count: number): string[] {
  const others = Object.keys(records)
    .filter((eventId) => eventId !== "333" && isCurrentEvent(eventId))
    .toSorted((a, b) => records[a].single.world_rank - records[b].single.world_rank);
  return [...(records["333"] ? ["333"] : []), ...others].slice(0, count);
}

export interface PodiumStats {
  podiums: number;
  /** Distinct events with a podium. */
  events: number;
  topEvent: { eventId: string; count: number } | null;
  /** The competition with the most podiums (the newest of a tie). */
  bestCompetition: { id: string; name: string; startDate: string; count: number } | null;
  bestYear: { year: string; count: number } | null;
  firstPodium: Podium | null;
  /** Competitions in a row, from the latest one with a final, that ended with a podium. */
  currentStreak: number;
}

// The entry with the highest count; ties keep the first one seen.
function topOf<T>(counts: Map<T, number>): [T, number] | null {
  let best: [T, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best;
}

function tally<T>(items: T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

/** More about the podiums: where and when they came from. */
export function podiumStats(results: PersonResult[]): PodiumStats {
  const finals = results.filter((result) => FINAL_ROUNDS.has(result.round_type_id) && result.best > 0);
  const list = podiums(results); // newest first

  const byEvent = topOf(tally(list.map((podium) => podium.result.event_id)));
  const byCompetition = topOf(tally(list.map((podium) => podium.result.competition_id)));
  const byYear = topOf(tally(list.map((podium) => podium.result.competition_start_date.slice(0, 4))));
  const competition = byCompetition && list.find((podium) => podium.result.competition_id === byCompetition[0])!.result;

  // Competitions with a final, newest first, and whether each had a podium.
  const withPodium = new Set(list.map((podium) => podium.result.competition_id));
  const competitions = [...new Map(
    finals
      .toSorted((a, b) => b.competition_start_date.localeCompare(a.competition_start_date))
      .map((result) => [result.competition_id, withPodium.has(result.competition_id)]),
  ).values()];
  const firstMiss = competitions.indexOf(false);

  return {
    podiums: list.length,
    events: new Set(list.map((podium) => podium.result.event_id)).size,
    topEvent: byEvent && { eventId: byEvent[0], count: byEvent[1] },
    bestCompetition: competition && {
      id: competition.competition_id,
      name: competition.competition_short_name,
      startDate: competition.competition_start_date,
      count: byCompetition[1],
    },
    bestYear: byYear && { year: byYear[0], count: byYear[1] },
    firstPodium: list.at(-1) ?? null,
    currentStreak: firstMiss === -1 ? competitions.length : firstMiss,
  };
}
