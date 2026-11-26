// Achievements, worked out from solves (and Solve of the Day marks) rather
// than stored. Solves already sync, so achievements reach every device; past
// solves (csTimer imports, WCA competition attempts) count the first time;
// and deleting a solve, or making it a DNF, takes back what it earned.
//
// Each achievement records when it was earned: the start of the solve that
// earned it. A device keeps which ones it has announced on its own.

import { TIMER_EVENTS, timerEvent } from "./events";
import { multiBlindPoints, solveValue, timingOf, type Solve } from "./solve";
import { normalizedRoundType } from "./competition";
import { rollingAverages } from "./stats";
import { addDays, localDate } from "./zone";
import type { SotdMark } from "./sotd";

export type AchievementCategory =
  | "practice" | "streaks" | "barriers" | "personal-bests" | "consistency" | "blind" | "variety" | "competition" | "sotd" | "secret";

export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  practice: "Practice",
  streaks: "Streaks",
  barriers: "Barriers",
  "personal-bests": "Personal bests",
  consistency: "Consistency",
  blind: "Blindfolded",
  variety: "Variety",
  competition: "Competition",
  sotd: "Solve of the Day",
  secret: "Secret",
};

/** Where a barrier's results come from, and which result it's about. */
export type BarrierKind = "single" | "average" | "competition-single" | "competition-average";

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  /** Hidden ("???") until earned. */
  secret?: boolean;
  /** Barriers: the event and which result. */
  eventId?: string;
  barrier?: BarrierKind;
}

export interface AchievementStatus {
  /** When it was earned (the start of the solve that earned it), or null. */
  earnedAt: number | null;
  /** How far along a counting achievement is. */
  progress: { current: number; target: number } | null;
}

export interface AchievementContext {
  solves: readonly Solve[];
  marks?: readonly SotdMark[];
  /** The calendar day of a moment; the browser's own zone by default. */
  dayOf?: (ms: number) => string;
  /** The hour (0–23) of a moment; the browser's own zone by default. */
  hourOf?: (ms: number) => number;
  /** Now, for the current streak. */
  now?: number;
}

export interface AchievementReport {
  statuses: Map<string, AchievementStatus>;
  /** Days in a row with a solve, up to today (or yesterday, so a streak isn't lost before today's first solve). */
  currentStreak: number;
  bestStreak: number;
  /** Events with at least one solve, and with at least one competition attempt. */
  eventsPracticed: Set<string>;
  eventsCompeted: Set<string>;
}

// ---------------------------------------------------------------------------
// The list

/**
 * Barriers by event, in seconds (moves for FMC, points for Multi-Blind).
 * "Sub-20" is a result under 20.00, the way cubers say it.
 */
export const BARRIERS: Record<string, readonly number[]> = {
  "333": [60, 30, 20, 15, 12, 10, 8],
  "222": [15, 10, 5, 3, 2],
  "444": [180, 120, 90, 60, 45, 35],
  "555": [300, 180, 120, 90, 70],
  "666": [480, 300, 240, 180, 140],
  "777": [600, 420, 330, 270, 210],
  "333bf": [600, 300, 120, 60, 40, 30, 20],
  "333fm": [60, 45, 35, 30, 25, 22],
  "333oh": [120, 60, 40, 30, 20, 15],
  clock: [30, 15, 10, 7, 5],
  minx: [300, 180, 120, 90, 60, 45],
  pyram: [20, 10, 6, 4, 3],
  skewb: [20, 10, 6, 4, 3],
  sq1: [120, 60, 30, 20, 12, 8],
  "444bf": [1800, 1200, 600, 300, 180],
  "555bf": [3600, 1800, 1200, 600, 360],
  "333mbf": [2, 5, 10, 15, 20, 30],
};

const PRACTICE_COUNTS = [1, 100, 500, 1000, 5000, 10000, 25000];
const PRACTICE_HOURS = [1, 10, 50, 100];
const DAY_COUNTS = [50, 100, 200];
const STREAK_DAYS = [3, 7, 14, 30, 100, 365];
const PB_COUNTS = [1, 10, 50, 100];
const BLD_RUNS = [3, 5, 10];
const VARIETY_COUNTS = [3, 8];
const COMPETITION_COUNTS = [1, 5, 10, 25, 50, 100];
const COMPETITION_EVENT_COUNTS = [5, 10];
const COMPETITION_PB_COUNTS = [1, 10, 25];
const SOTD_STREAKS = [7, 30, 100, 365];
const CLEAN_RUNS = [12, 50, 100];
const BLD_EVENTS = ["333bf", "444bf", "555bf", "333mbf"];

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

/** A barrier's threshold as cubers say it: "Sub-20", "Sub-1:30", "Sub-30 moves", "10 points". */
export function barrierLabel(eventId: string, threshold: number): string {
  const { kind } = timerEvent(eventId);
  if (kind === "multi-blind") return plural(threshold, "point");
  if (kind === "fewest-moves") return `Sub-${threshold}`;
  if (threshold < 60) return `Sub-${threshold}`;
  const minutes = Math.floor(threshold / 60);
  const seconds = threshold % 60;
  return seconds === 0 && minutes >= 10 ? `Sub-${minutes}:00` : `Sub-${minutes}:${String(seconds).padStart(2, "0")}`;
}

export const barrierId = (eventId: string, kind: BarrierKind, threshold: number) => `barrier:${eventId}:${kind}:${threshold}`;

/** Which barrier kinds an event has: Multi-Blind has no averages. */
export function barrierKinds(eventId: string): BarrierKind[] {
  return timerEvent(eventId).format === "best" ? ["single", "competition-single"] : ["single", "average", "competition-single", "competition-average"];
}

function barrierDescription(eventId: string, kind: BarrierKind, threshold: number): string {
  const event = timerEvent(eventId);
  const where = kind.startsWith("competition") ? " in competition" : "";
  const what = kind.endsWith("average") ? (event.format === "mo3" ? "mean of 3" : "average of 5") : "single";
  if (event.kind === "multi-blind") return `A ${event.shortName} result of ${plural(threshold, "point")} or more${where}`;
  if (event.kind === "fewest-moves") return `A ${event.shortName} ${what} under ${threshold} moves${where}`;
  return `A ${event.shortName} ${what} ${barrierLabel(eventId, threshold).replace("Sub-", "under ")}${threshold < 60 ? " seconds" : ""}${where}`;
}

function buildList(): Achievement[] {
  const list: Achievement[] = [];
  const add = (a: Achievement) => list.push(a);

  for (const n of PRACTICE_COUNTS) {
    add({ id: `solves:${n}`, category: "practice", title: n === 1 ? "First turn" : `${n.toLocaleString("en-US")} solves`, description: n === 1 ? "Finish your first solve" : `Finish ${plural(n, "solve")}` });
  }
  for (const h of PRACTICE_HOURS) add({ id: `hours:${h}`, category: "practice", title: `${plural(h, "hour")} solving`, description: `Spend ${plural(h, "hour")} solving, added up` });
  for (const n of DAY_COUNTS) add({ id: `day:${n}`, category: "practice", title: n === 50 ? "Big session" : n === 100 ? "Marathon" : "Ultramarathon", description: `${plural(n, "solve")} in one day` });

  for (const d of STREAK_DAYS) add({ id: `streak:${d}`, category: "streaks", title: d === 365 ? "Every day for a year" : `${d}-day streak`, description: `Solve on ${d} days in a row` });

  for (const event of TIMER_EVENTS) {
    for (const kind of barrierKinds(event.id)) {
      for (const threshold of BARRIERS[event.id] ?? []) {
        add({
          id: barrierId(event.id, kind, threshold), category: "barriers", eventId: event.id, barrier: kind,
          title: `${event.shortName} ${barrierLabel(event.id, threshold)}`, description: barrierDescription(event.id, kind, threshold),
        });
      }
    }
  }

  for (const n of PB_COUNTS) {
    add({ id: `pbs:${n}`, category: "personal-bests", title: n === 1 ? "New personal best" : `${n} personal bests`, description: n === 1 ? "Beat your best single in an event" : `Beat your best single ${n} times, in any events` });
  }

  for (const n of CLEAN_RUNS) add({ id: `clean:${n}`, category: "consistency", title: n === 12 ? "Clean dozen" : `Clean ${n}`, description: `${n} solves in a row in one session with no +2 or DNF` });
  add({ id: "steady:5", category: "consistency", title: "Steady hands", description: "Five solves in a row within 10% of each other" });
  add({ id: "steady:12", category: "consistency", title: "Metronome", description: "Twelve solves in a row within 15% of each other" });

  for (const eventId of BLD_EVENTS) {
    const { shortName } = timerEvent(eventId);
    add({ id: `bld-first:${eventId}`, category: "blind", title: `First ${shortName} success`, description: `Solve a ${shortName} attempt` });
  }
  for (const n of BLD_RUNS) add({ id: `bld-run:${n}`, category: "blind", title: `${n} in a row`, description: `${n} 3BLD successes in a row` });

  for (const n of VARIETY_COUNTS) add({ id: `events:${n}`, category: "variety", title: `${n} events`, description: `Do a solve in ${n} different events` });
  add({ id: `events:all`, category: "variety", title: "Every event", description: `Do a solve in all ${TIMER_EVENTS.length} WCA events` });

  for (const n of COMPETITION_COUNTS) {
    add({ id: `comps:${n}`, category: "competition", title: n === 1 ? "Competitor" : `${n} competitions`, description: n === 1 ? "Compete at a WCA competition" : `Compete at ${n} WCA competitions` });
  }
  for (const n of COMPETITION_EVENT_COUNTS) add({ id: `comp-events:${n}`, category: "competition", title: `${n} events competed`, description: `Compete in ${n} different events` });
  for (const n of COMPETITION_PB_COUNTS) {
    add({ id: `comp-pbs:${n}`, category: "competition", title: n === 1 ? "Competition PR" : `${n} competition PRs`, description: n === 1 ? "Beat your official single in an event" : `Beat your official single ${n} times` });
  }
  add({ id: "comp:final", category: "competition", title: "Finalist", description: "Compete in a final" });
  add({ id: "comp:podium", category: "competition", title: "Podium", description: "Place in the top three of a final" });
  add({ id: "comp:win", category: "competition", title: "Champion", description: "Win a final" });
  add({ id: "comp:record", category: "competition", title: "Record breaker", description: "Set a national record or better" });

  for (const d of SOTD_STREAKS) add({ id: `sotd:${d}`, category: "sotd", title: `${d} days of SOTD`, description: `A Solve of the Day on ${d} days in a row` });

  add({ id: "secret:sevens", category: "secret", secret: true, title: "Lucky sevens", description: "A time of exactly 7.77" });
  add({ id: "secret:palindrome", category: "secret", secret: true, title: "Palindrome", description: "A time that reads the same backwards, like 12.21" });
  add({ id: "secret:photo-finish", category: "secret", secret: true, title: "Photo finish", description: "Beat your best single by a hundredth" });
  add({ id: "secret:so-close", category: "secret", secret: true, title: "So close", description: "A +2 that would have been a personal best" });
  add({ id: "secret:night-owl", category: "secret", secret: true, title: "Night owl", description: "A solve between 2 and 5 in the morning" });
  add({ id: "secret:early-bird", category: "secret", secret: true, title: "Early bird", description: "A solve between 5 and 7 in the morning" });
  add({ id: "secret:round-number", category: "secret", secret: true, title: "Round number", description: "A time of exactly 10.00, 20.00 or 30.00" });
  return list;
}

export const ACHIEVEMENTS: readonly Achievement[] = buildList();
export const ACHIEVEMENTS_BY_ID: ReadonlyMap<string, Achievement> = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
// Working them out

/**
 * Whether a solve counts toward results-based achievements (barriers,
 * personal bests, consistency). Typed times don't for timed events, since
 * anything can be typed; FMC and Multi-Blind results are typed by nature.
 */
export function countsForResults(solve: Solve): boolean {
  if (timerEvent(solve.eventId).kind !== "time") return true;
  return timingOf(solve) !== "typed";
}

/** The run of solves an average is taken over: a session, or a competition round. */
const runKey = (solve: Solve) => solve.competition ? `comp:${solve.competition.competitionId}:${solve.eventId}:${solve.competition.roundTypeId}` : `session:${solve.sessionId}`;

const RECORDS = new Set(["NR", "AfR", "AsR", "ER", "NAR", "OcR", "SAR", "WR"]);

/** Hundredths, the way a time is shown. */
const centis = (ms: number) => Math.floor(ms / 10);

export function evaluateAchievements(ctx: AchievementContext): AchievementReport {
  const dayOf = ctx.dayOf ?? ((ms: number) => localDate(ms));
  const hourOf = ctx.hourOf ?? ((ms: number) => new Date(ms).getHours());
  const statuses = new Map<string, AchievementStatus>(ACHIEVEMENTS.map((a) => [a.id, { earnedAt: null, progress: null }]));

  /** Earns an achievement at `at`, unless it was already earned earlier. */
  const earn = (id: string, at: number) => {
    const status = statuses.get(id);
    if (status && (status.earnedAt === null || at < status.earnedAt)) status.earnedAt = at;
  };
  const progress = (id: string, current: number, target: number) => {
    const status = statuses.get(id);
    if (status) status.progress = { current: Math.min(current, target), target };
  };
  /** Earns each count-based achievement as `count` reaches its target, and records progress toward it. */
  const counter = (prefix: string, targets: readonly number[]) => {
    let count = 0;
    return {
      add(at: number, by = 1) {
        count += by;
        for (const t of targets) if (count >= t) earn(`${prefix}:${t}`, at);
      },
      finish(scale = 1) {
        for (const t of targets) progress(`${prefix}:${t}`, Math.floor(count / scale), t);
      },
      get count() {
        return count;
      },
    };
  };

  const solves = ctx.solves.filter((s) => s.deletedAt === null).toSorted((a, b) => a.startedAt - b.startedAt || a.createdAt - b.createdAt);

  // Practice: solves, hours, solves in a day.
  const total = counter("solves", PRACTICE_COUNTS);
  let solvingMs = 0;
  const perDay = new Map<string, number>();
  const firstOnDay = new Map<string, number>();
  for (const s of solves) {
    total.add(s.startedAt);
    solvingMs += s.timeMs;
    for (const h of PRACTICE_HOURS) if (solvingMs >= h * 3_600_000) earn(`hours:${h}`, s.startedAt);
    const day = dayOf(s.startedAt);
    const n = (perDay.get(day) ?? 0) + 1;
    perDay.set(day, n);
    if (!firstOnDay.has(day)) firstOnDay.set(day, s.startedAt);
    for (const t of DAY_COUNTS) if (n >= t) earn(`day:${t}`, s.startedAt);
  }
  total.finish();
  for (const h of PRACTICE_HOURS) progress(`hours:${h}`, Math.floor(solvingMs / 3_600_000), h);
  const bestDay = Math.max(0, ...perDay.values());
  for (const t of DAY_COUNTS) progress(`day:${t}`, bestDay, t);

  // Streaks: days in a row with a solve.
  const days = [...firstOnDay.keys()].toSorted();
  let run = 0;
  let bestStreak = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    for (const d of STREAK_DAYS) if (run >= d) earn(`streak:${d}`, firstOnDay.get(day)!);
    previous = day;
  }
  for (const d of STREAK_DAYS) progress(`streak:${d}`, bestStreak, d);
  const today = dayOf(ctx.now ?? Date.now());
  const currentStreak = previous !== null && (previous === today || addDays(previous, 1) === today) ? run : 0;

  // By event: barriers, personal bests, blind, secrets.
  const pbs = counter("pbs", PB_COUNTS);
  const compPbs = counter("comp-pbs", COMPETITION_PB_COUNTS);
  const eventsPracticed = new Set<string>();
  const eventsCompeted = new Set<string>();
  const variety = counter("events", VARIETY_COUNTS);
  const byEvent = Map.groupBy(solves, (s) => s.eventId);

  for (const [eventId, eventSolves] of byEvent) {
    const event = timerEvent(eventId);
    const thresholds = BARRIERS[eventId] ?? [];
    eventsPracticed.add(eventId);
    variety.add(eventSolves[0].startedAt);
    if (eventsPracticed.size === TIMER_EVENTS.length) earn("events:all", eventSolves[0].startedAt);

    let best = Infinity;
    let bestCompetition = Infinity;
    let bldRun = 0;
    for (const s of eventSolves) {
      const value = solveValue(s);
      const competition = s.source === "competition";
      if (competition) eventsCompeted.add(eventId);

      if (BLD_EVENTS.includes(eventId) && Number.isFinite(value)) earn(`bld-first:${eventId}`, s.startedAt);
      if (eventId === "333bf") {
        bldRun = Number.isFinite(value) ? bldRun + 1 : 0;
        for (const n of BLD_RUNS) if (bldRun >= n) earn(`bld-run:${n}`, s.startedAt);
      }

      if (!countsForResults(s)) continue;

      // Barriers on singles.
      const points = event.kind === "multi-blind" && s.multi && s.penalty !== "dnf" ? multiBlindPoints(s.multi) : null;
      for (const t of thresholds) {
        const passes = event.kind === "multi-blind" ? points !== null && points >= t : event.kind === "fewest-moves" ? value < t : value < t * 1000;
        if (!passes) continue;
        earn(barrierId(eventId, "single", t), s.startedAt);
        if (competition) earn(barrierId(eventId, "competition-single", t), s.startedAt);
      }

      // Personal bests (Multi-Blind's ranking is by points, so it's left out of these).
      if (event.kind !== "multi-blind" && Number.isFinite(value)) {
        if (value < best) {
          if (Number.isFinite(best)) {
            pbs.add(s.startedAt);
            if (event.kind === "time" && centis(best) - centis(value) === 1) earn("secret:photo-finish", s.startedAt);
          }
          best = value;
        } else if (event.kind === "time" && s.penalty === "+2" && s.timeMs < best) {
          earn("secret:so-close", s.startedAt);
        }
        if (competition && value < bestCompetition) {
          if (Number.isFinite(bestCompetition)) compPbs.add(s.startedAt);
          bestCompetition = value;
        }
      }

      // Secrets about the time itself.
      if (event.kind === "time" && Number.isFinite(value)) {
        const c = centis(value);
        if (c === 777) earn("secret:sevens", s.startedAt);
        if (c === 1000 || c === 2000 || c === 3000) earn("secret:round-number", s.startedAt);
        const digits = String(c);
        if (digits.length >= 4 && digits === [...digits].toReversed().join("")) earn("secret:palindrome", s.startedAt);
      }
    }

    // Averages: over each session (or competition round), only results that count.
    if (event.format !== "best") {
      const size = event.format === "mo3" ? 3 : 5;
      const kind = event.format === "mo3" ? "mean" : "average";
      for (const runSolves of Map.groupBy(eventSolves.filter(countsForResults), runKey).values()) {
        const averages = rollingAverages(runSolves.map(solveValue), { kind, size });
        const competition = runSolves[0].source === "competition";
        averages.forEach((average, i) => {
          if (average === null || !Number.isFinite(average)) return;
          for (const t of thresholds) {
            if (average >= (event.kind === "fewest-moves" ? t : t * 1000)) continue;
            earn(barrierId(eventId, competition ? "competition-average" : "average", t), runSolves[i].startedAt);
          }
        });
      }
    }
  }
  pbs.finish();
  compPbs.finish();
  variety.finish();
  progress("events:all", eventsPracticed.size, TIMER_EVENTS.length);

  // Consistency: runs within a session.
  for (const runSolves of Map.groupBy(solves.filter((s) => s.source === "home" && countsForResults(s) && timerEvent(s.eventId).kind === "time"), runKey).values()) {
    let clean = 0;
    runSolves.forEach((s, i) => {
      clean = s.penalty === "none" ? clean + 1 : 0;
      for (const n of CLEAN_RUNS) if (clean >= n) earn(`clean:${n}`, s.startedAt);
      for (const [size, spread] of [[5, 0.1], [12, 0.15]] as const) {
        if (i < size - 1) continue;
        const window = runSolves.slice(i - size + 1, i + 1).map(solveValue);
        if (!window.every(Number.isFinite)) continue;
        const low = Math.min(...window);
        const high = Math.max(...window);
        if (high - low <= low * spread) earn(`steady:${size}`, s.startedAt);
      }
    });
  }

  // Competition.
  const competitionSolves = solves.filter((s) => s.competition !== null);
  const comps = counter("comps", COMPETITION_COUNTS);
  const compEvents = counter("comp-events", COMPETITION_EVENT_COUNTS);
  const seenComps = new Set<string>();
  const seenCompEvents = new Set<string>();
  for (const s of competitionSolves) {
    const attempt = s.competition!;
    if (!seenComps.has(attempt.competitionId)) {
      seenComps.add(attempt.competitionId);
      comps.add(s.startedAt);
    }
    if (!seenCompEvents.has(s.eventId)) {
      seenCompEvents.add(s.eventId);
      compEvents.add(s.startedAt);
    }
    if (normalizedRoundType(attempt.roundTypeId) === "f") {
      earn("comp:final", s.startedAt);
      if (attempt.position !== null && attempt.position <= 3) earn("comp:podium", s.startedAt);
      if (attempt.position === 1) earn("comp:win", s.startedAt);
    }
    if ((attempt.singleRecord && RECORDS.has(attempt.singleRecord)) || (attempt.averageRecord && RECORDS.has(attempt.averageRecord))) earn("comp:record", s.startedAt);
  }
  comps.finish();
  compEvents.finish();

  // Solve of the Day: days in a row with a mark (in any event).
  const markDays = [...new Set((ctx.marks ?? []).filter((m) => m.deletedAt === null).map((m) => m.date))].toSorted();
  const solveStart = new Map(solves.map((s) => [s.id, s.startedAt]));
  const markTime = new Map<string, number>();
  for (const m of ctx.marks ?? []) {
    if (m.deletedAt !== null) continue;
    const at = solveStart.get(m.solveId) ?? m.updatedAt;
    markTime.set(m.date, Math.min(markTime.get(m.date) ?? Infinity, at));
  }
  let sotdRun = 0;
  let bestSotd = 0;
  let previousMark: string | null = null;
  for (const day of markDays) {
    sotdRun = previousMark !== null && addDays(previousMark, 1) === day ? sotdRun + 1 : 1;
    bestSotd = Math.max(bestSotd, sotdRun);
    for (const d of SOTD_STREAKS) if (sotdRun >= d) earn(`sotd:${d}`, markTime.get(day)!);
    previousMark = day;
  }
  for (const d of SOTD_STREAKS) progress(`sotd:${d}`, bestSotd, d);

  // Time of day.
  for (const s of solves) {
    if (s.source !== "home" || s.entry !== "timer") continue;
    const hour = hourOf(s.startedAt);
    if (hour >= 2 && hour < 5) earn("secret:night-owl", s.startedAt);
    if (hour >= 5 && hour < 7) earn("secret:early-bird", s.startedAt);
  }

  // An earned achievement's progress is full.
  for (const status of statuses.values()) {
    if (status.earnedAt !== null && status.progress) status.progress = { current: status.progress.target, target: status.progress.target };
  }

  return { statuses, currentStreak, bestStreak, eventsPracticed, eventsCompeted };
}

/** The ids of earned achievements. */
export function earnedIds(report: AchievementReport): Set<string> {
  return new Set([...report.statuses].filter(([, s]) => s.earnedAt !== null).map(([id]) => id));
}
