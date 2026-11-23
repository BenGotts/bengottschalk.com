import type { HistoryEntry, HistoryStats } from "./competitions";
import { eventName, isCurrentEvent } from "./events";
import { formatResult } from "./format";
import type { PodiumGoal, PodiumGoalRow } from "./podiumGoal";
import type { Person, PersonResult } from "./schemas";
import type { Podium } from "./stats";

/** Which icon a badge shows; the component maps these to icons. */
export type BadgeIcon =
  | "trophy"
  | "hat-trick"
  | "sweep"
  | "haul"
  | "record"
  | "flag"
  | "globe"
  | "calendar"
  | "medal"
  | "marathon"
  | "busy"
  | "plane"
  | "car"
  | "decade"
  | "bolt"
  | "delegate";

/** A badge's color: cube colors plus purple. No red, so it never sits next to green. */
export type BadgeTone = "blue" | "green" | "orange" | "yellow" | "purple";

export interface EarnedBadge {
  id: string;
  name: string;
  /** What earned it, e.g. "4 golds at Inland Empire Summer 2022". */
  detail: string;
  icon: BadgeIcon;
  tone: BadgeTone;
}

export interface BadgeInput {
  person: Person;
  results: PersonResult[];
  podiums: Podium[];
  /** Finished competitions, competed in or delegated. */
  history: HistoryEntry[];
  stats: HistoryStats;
  /** Each competition's main event, for competitions with a gold (see getMainEventId). */
  mainEvents: ReadonlyMap<string, string>;
  /** Whether the person is a WCA Delegate now. */
  isDelegate: boolean;
  /** Today, as `YYYY-MM-DD`. */
  today: string;
}

const RECORD_NAMES: Record<string, string> = {
  WR: "World record",
  NR: "National record",
  NAR: "North American record",
  SAR: "South American record",
  ER: "European record",
  AsR: "Asian record",
  AfR: "African record",
  OcR: "Oceanian record",
};
const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;
const ordinal = (n: number) => `#${n}`;

function oldestFirst(a: Podium, b: Podium): number {
  return a.result.competition_start_date.localeCompare(b.result.competition_start_date);
}

/** The highest tier reached, e.g. 150 for 158 with tiers [50, 100, 150, 200]. */
function tier(value: number, tiers: number[]): number | null {
  return tiers.findLast((t) => value >= t) ?? null;
}

/** The entry with the most, and how many; the earliest of a tie. */
function most<K>(counts: Map<K, number>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best;
}

function countBy<T, K>(items: T[], key: (item: T) => K): Map<K, number> {
  const counts = new Map<K, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return counts;
}

/**
 * The fun badges earned so far, most notable first. Each has a rule with a
 * threshold (or tiers), so new ones appear by themselves as they're earned.
 */
export function earnedBadges({ person, results, podiums, history, stats, mainEvents, isDelegate, today }: BadgeInput): EarnedBadge[] {
  const badges: EarnedBadge[] = [];
  // Competitions oldest first, so ties go to the first time it happened.
  const ordered = podiums.toSorted(oldestFirst);
  const nameOf = new Map(results.map((result) => [result.competition_id, result.competition_short_name]));

  // Competition wins: gold in the competition's main event.
  const wins = ordered.filter((podium) => podium.medal === "gold" && mainEvents.get(podium.result.competition_id) === podium.result.event_id);
  if (wins.length > 0) {
    const latest = wins.at(-1)!.result;
    badges.push({
      id: "winner",
      name: "Competition winner",
      detail: wins.length === 1 ? `Won ${latest.competition_short_name}` : `Won ${wins.length} competitions, latest ${latest.competition_short_name}`,
      icon: "trophy",
      tone: "blue",
    });
  }

  // Hat trick: 3 or more golds at one competition.
  const golds = most(countBy(ordered.filter((podium) => podium.medal === "gold"), (podium) => podium.result.competition_id));
  if (golds && golds[1] >= 3) {
    badges.push({ id: "hat-trick", name: "Hat trick", detail: `${golds[1]} golds at ${nameOf.get(golds[0])}`, icon: "hat-trick", tone: "yellow" });
  }

  // Clean sweep: a podium in every event entered, at least 3.
  const entered = new Map<string, Set<string>>();
  for (const result of results) entered.set(result.competition_id, (entered.get(result.competition_id) ?? new Set()).add(result.event_id));
  const podiumEvents = new Map<string, Set<string>>();
  for (const { result } of ordered) podiumEvents.set(result.competition_id, (podiumEvents.get(result.competition_id) ?? new Set()).add(result.event_id));
  const sweeps = [...podiumEvents].filter(([id, events]) => events.size >= 3 && events.size === entered.get(id)?.size);
  if (sweeps.length > 0) {
    const [id, events] = sweeps.reduce((best, sweep) => (sweep[1].size > best[1].size ? sweep : best));
    badges.push({
      id: "sweep",
      name: "Clean sweep",
      detail: `A podium in all ${events.size} events at ${nameOf.get(id)}${sweeps.length > 1 ? `, and ${plural(sweeps.length - 1, "more time")}` : ""}`,
      icon: "sweep",
      tone: "green",
    });
  }

  // Medal haul: 5 or more podiums at one competition.
  const haul = most(countBy(ordered, (podium) => podium.result.competition_id));
  if (haul && haul[1] >= 5) {
    badges.push({ id: "haul", name: "Medal haul", detail: `${haul[1]} podiums at ${nameOf.get(haul[0])}`, icon: "haul", tone: "orange" });
  }

  // Record breaker: a national, continental or world record.
  const records = results.flatMap((result) => [
    ...(result.regional_single_record ? [{ result, kind: "single" as const, record: result.regional_single_record, value: result.best }] : []),
    ...(result.regional_average_record ? [{ result, kind: "average" as const, record: result.regional_average_record, value: result.average }] : []),
  ]);
  if (records.length > 0) {
    const { result, kind, record, value } = records[0];
    badges.push({
      id: "record",
      name: "Record breaker",
      detail: `${RECORD_NAMES[record] ?? record}, ${eventName(result.event_id)} ${kind} (${formatResult(result.event_id, value, kind)})${records.length > 1 ? `, +${records.length - 1} more` : ""}`,
      icon: "record",
      tone: "purple",
    });
  }

  // Ranks: the best current national and world ranks among current events.
  const ranks = Object.entries(person.personal_records)
    .filter(([eventId]) => isCurrentEvent(eventId))
    .flatMap(([eventId, pr]) => [
      { eventId, kind: "single", ...pr.single },
      ...(pr.average ? [{ eventId, kind: "average", ...pr.average }] : []),
    ]);
  const bestNational = ranks.toSorted((a, b) => a.country_rank - b.country_rank)[0];
  if (bestNational && bestNational.country_rank <= 10) {
    badges.push({
      id: "national-top-10",
      name: "National top 10",
      detail: `${ordinal(bestNational.country_rank)} in ${person.person.country.name}, ${eventName(bestNational.eventId)} ${bestNational.kind}`,
      icon: "flag",
      tone: "blue",
    });
  }
  const bestWorld = ranks.toSorted((a, b) => a.world_rank - b.world_rank)[0];
  const worldTier = bestWorld ? [10, 25, 50, 100].find((t) => bestWorld.world_rank <= t) : undefined;
  if (bestWorld && worldTier) {
    badges.push({
      id: "world-top",
      name: `World top ${worldTier}`,
      detail: `${ordinal(bestWorld.world_rank)} in the world, ${eventName(bestWorld.eventId)} ${bestWorld.kind}`,
      icon: "globe",
      tone: "purple",
    });
  }

  // Sub-X 3x3x3 average.
  const cubeAverage = person.personal_records["333"]?.average?.best;
  const sub = cubeAverage ? [6, 7, 8, 10, 15, 20].find((seconds) => cubeAverage < seconds * 100) : undefined;
  if (cubeAverage && sub) {
    badges.push({ id: "sub", name: `Sub-${sub}`, detail: `3x3x3 Cube average of ${formatResult("333", cubeAverage, "average")}`, icon: "bolt", tone: "yellow" });
  }

  // Career totals, by tier.
  const competitionTier = tier(stats.competed, [25, 50, 100, 150, 200, 250, 300]);
  if (competitionTier) {
    badges.push({ id: "competitions", name: `${competitionTier} competitions`, detail: `${stats.competed} competed in so far`, icon: "calendar", tone: "green" });
  }
  const podiumTier = tier(podiums.length, [10, 25, 50, 100, 200, 300, 400, 500]);
  if (podiumTier) {
    badges.push({ id: "podiums", name: `${podiumTier} podiums`, detail: `${podiums.length} so far, ${person.medals.gold} of them gold`, icon: "medal", tone: "orange" });
  }

  // Marathon: 15 or more events at one competition.
  const events = most(new Map([...entered].map(([id, set]) => [id, set.size])));
  if (events && events[1] >= 15) {
    badges.push({ id: "marathon", name: "Marathon", detail: `${events[1]} events at ${nameOf.get(events[0])}`, icon: "marathon", tone: "orange" });
  }

  // Busy year: 20 or more competitions in a calendar year.
  const busiest = most(countBy(history.filter((entry) => entry.competed), (entry) => entry.start_date.slice(0, 4)));
  if (busiest && busiest[1] >= 20) {
    badges.push({ id: "busy-year", name: "Busy year", detail: `${busiest[1]} competitions in ${busiest[0]}`, icon: "busy", tone: "purple" });
  }

  // Travel.
  if (stats.countries >= 5) {
    badges.push({ id: "globetrotter", name: "Globetrotter", detail: `Competed in ${stats.countries} countries`, icon: "plane", tone: "blue" });
  }
  if (stats.usStates >= 10) {
    badges.push({ id: "road-tripper", name: "Road tripper", detail: `Competed in ${stats.usStates} US states`, icon: "car", tone: "green" });
  }

  // Years since the first competition.
  const first = history.findLast((entry) => entry.competed)?.start_date;
  if (first) {
    const years = Number(today.slice(0, 4)) - Number(first.slice(0, 4)) - (today.slice(5) < first.slice(5) ? 1 : 0);
    const yearTier = tier(years, [5, 10, 15, 20]);
    if (yearTier) {
      badges.push({
        id: "years",
        name: yearTier === 10 ? "A decade of cubing" : `${yearTier} years of cubing`,
        detail: `Competing since ${first.slice(0, 4)}`,
        icon: "decade",
        tone: "orange",
      });
    }
  }

  // The current role can be newer than the first competition delegated, so the
  // detail comes from the competitions themselves.
  const firstDelegated = history.findLast((entry) => entry.delegated)?.start_date;
  if (isDelegate && firstDelegated) {
    badges.push({
      id: "delegate",
      name: "WCA Delegate",
      detail: `${plural(stats.delegated, "competition")} delegated since ${firstDelegated.slice(0, 4)}`,
      icon: "delegate",
      tone: "purple",
    });
  }

  return badges;
}

/** Events with all three placements (1st, 2nd and 3rd): current ones, then retired. */
export function tripleCrowns(goal: PodiumGoal): { row: PodiumGoalRow; retired: boolean }[] {
  return [
    ...goal.rows.filter((row) => row.complete).map((row) => ({ row, retired: false })),
    ...goal.retired.filter((row) => row.complete).map((row) => ({ row, retired: true })),
  ];
}
