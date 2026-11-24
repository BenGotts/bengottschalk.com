// Competition attempts from the WCA, as solves in each event's main session.
//
// Official results come from the WCA API (`v1/persons/{id}/results`); while a
// competition is on, WCA Live has them first. Each attempt gets a fixed id
// (see `competitionSolveId`) from the competition, event, round and attempt,
// so refreshing updates the same solve and official results replace live ones.
//
// The WCA doesn't record when an attempt happened, so `startedAt` is worked
// out from the competition's schedule (public WCIF): the attempts are spread
// through the competitor's group slot, or the round's slot, or else placed at
// midday on the competition's first day. That puts them among home solves at
// about the right moment.

import { decodeMultiResult } from "@wca/helpers";
import { CURRENT_EVENT_IDS } from "@bengottschalk/wca/events";
import { isTimerEvent, timerEvent } from "./events";
import { mainSessionId } from "./sessions";
import { competitionSolveId, type CompetitionAttempt, type Solve } from "./solve";
import { formatAverage } from "./time";

/** A result row from `v1/persons/{id}/results` (the fields used here). */
export interface WcaPersonResult {
  competition_id: string;
  competition_short_name: string;
  competition_start_date: string;
  event_id: string;
  round_type_id: string;
  pos: number;
  best: number;
  average: number;
  attempts: number[];
  regional_single_record: string | null;
  regional_average_record: string | null;
}

export interface WcifActivity {
  id: number;
  activityCode: string;
  startTime: string;
  endTime: string;
  childActivities: WcifActivity[];
}

/** The parts of a competition's public WCIF used for placement. */
export interface WcifForPlacement {
  id: string;
  name: string;
  events?: { id: string; rounds: { id: string }[] }[];
  persons: { wcaId?: string | null; assignments?: { activityId: number; assignmentCode: string }[] }[];
  schedule: {
    startDate: string;
    venues: { timezone: string; rooms: { activities: WcifActivity[] }[] }[];
  };
}

/** A result from WCA Live (the fields used here). */
export interface WcaLiveResult {
  ranking: number | null;
  average: number | null;
  singleRecordTag: string | null;
  averageRecordTag: string | null;
  attempts: { result: number }[];
  round: { number: number; name: string; competitionEvent: { event: { id: string } }; format: { numberOfAttempts: number } };
}

// Combined rounds (with a cutoff) are the same round as their plain type.
const NORMALIZED_ROUND_TYPE: Record<string, string> = { c: "f", d: "1", e: "2", g: "3", h: "0" };
const ROUND_RANK: Record<string, number> = { "0": 0, "1": 1, "2": 2, "3": 3, b: 4, f: 5 };

/** The round type an attempt's id uses: combined rounds (`d`, `c`, …) count as their plain type, so WCA Live's rounds match. */
export const normalizedRoundType = (roundTypeId: string): string => NORMALIZED_ROUND_TYPE[roundTypeId] ?? roundTypeId;

const isFinal = (roundTypeId: string) => normalizedRoundType(roundTypeId) === "f";

/** A WCA round type's name: "First round", "Final", … */
export function roundName(roundTypeId: string): string {
  return { "0": "Qualification round", "1": "First round", "2": "Second round", "3": "Semi-final", b: "B Final", f: "Final" }[normalizedRoundType(roundTypeId)] ?? `Round ${roundTypeId}`;
}

/** The round's number at the competition: finals are the event's last round. */
export function roundNumberFor(roundTypeId: string, roundCount: number | null): number | null {
  if (isFinal(roundTypeId)) return roundCount;
  const rank = ROUND_RANK[normalizedRoundType(roundTypeId)];
  return rank === undefined || rank === 0 || rank > 3 ? null : rank;
}

/** Milliseconds since 1970 for a wall-clock time in a time zone. */
export function zonedTime(date: string, hour: number, timeZone: string | null): number {
  const [y, m, d] = date.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hour);
  if (!timeZone) return utcGuess;
  try {
    // The zone's offset at that moment: format the UTC guess in the zone and compare.
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(utcGuess));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
    const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return utcGuess - (asIfUtc - utcGuess);
  } catch {
    return utcGuess;
  }
}

export interface Placement {
  times: number[];
  estimate: CompetitionAttempt["timeEstimate"];
}

/** Spreads `count` attempts evenly through a slot: each one in the middle of its share. */
function spread(start: number, end: number, count: number): number[] {
  const span = Math.max(0, end - start);
  return Array.from({ length: count }, (_, i) => Math.round(start + ((i + 0.5) * span) / count));
}

function allActivities(wcif: WcifForPlacement): WcifActivity[] {
  const out: WcifActivity[] = [];
  const visit = (activity: WcifActivity) => {
    out.push(activity);
    activity.childActivities.forEach(visit);
  };
  for (const venue of wcif.schedule.venues) for (const room of venue.rooms) room.activities.forEach(visit);
  return out;
}

/**
 * Works out when one person's attempts in each round happened, from a
 * competition's schedule. Returns a function from a round (event, round
 * number, attempt count) to attempt times, or null when the schedule doesn't
 * cover that round.
 */
export function schedulePlacer(wcif: WcifForPlacement, wcaId: string): (eventId: string, roundNumber: number | null, count: number) => Placement | null {
  const activities = allActivities(wcif);
  const byId = new Map(activities.map((a) => [a.id, a]));
  const person = wcif.persons.find((p) => p.wcaId === wcaId);
  const competing = (person?.assignments ?? [])
    .filter((a) => a.assignmentCode === "competitor")
    .map((a) => byId.get(a.activityId))
    .filter((a): a is WcifActivity => a !== undefined);

  return (eventId, roundNumber, count) => {
    if (roundNumber === null || count === 0) return null;
    const round = `${eventId}-r${roundNumber}`;

    // FMC and Multi-Blind schedule each attempt (`333fm-r1-a2`): one attempt per slot.
    const attemptSlots = Array.from({ length: count }, (_, i) => activities.find((a) => a.activityCode === `${round}-a${i + 1}`));
    if (attemptSlots.every((a) => a !== undefined)) {
      return { times: attemptSlots.map((a) => spread(Date.parse(a!.startTime), Date.parse(a!.endTime), 1)[0]), estimate: "group" };
    }

    const group = competing.find((a) => a.activityCode.startsWith(`${round}-g`));
    if (group) return { times: spread(Date.parse(group.startTime), Date.parse(group.endTime), count), estimate: "group" };

    const slots = activities.filter((a) => a.activityCode === round);
    if (slots.length > 0) {
      const start = Math.min(...slots.map((a) => Date.parse(a.startTime)));
      const end = Math.max(...slots.map((a) => Date.parse(a.endTime)));
      return { times: spread(start, end, count), estimate: "round" };
    }
    return null;
  };
}

/** Midday on the competition's first day, keeping events and rounds in order (a minute per attempt, 15 per round). */
function dayPlacement(startDate: string, timeZone: string | null, eventId: string, roundTypeId: string, count: number): Placement {
  const eventIndex = Math.max(0, (CURRENT_EVENT_IDS as readonly string[]).indexOf(eventId));
  const rank = ROUND_RANK[normalizedRoundType(roundTypeId)] ?? 0;
  const base = zonedTime(startDate, 12, timeZone) + (eventIndex * 6 + rank) * 15 * 60_000;
  return { times: Array.from({ length: count }, (_, i) => base + i * 60_000), estimate: "day" };
}

interface AttemptValue {
  timeMs: number;
  penalty: Solve["penalty"];
  fmc: Solve["fmc"];
  multi: Solve["multi"];
}

/** One attempt's WCA value as solve fields, or null for an attempt that wasn't made (0, DNS). */
export function attemptValue(eventId: string, value: number): AttemptValue | null {
  if (value === 0 || value === -2) return null;
  const { kind } = timerEvent(eventId);
  const dnf = value === -1;
  if (kind === "fewest-moves") return { timeMs: 0, penalty: dnf ? "dnf" : "none", fmc: dnf ? null : { solution: "", moves: value }, multi: null };
  if (kind === "multi-blind") {
    if (dnf) return { timeMs: 0, penalty: "dnf", fmc: null, multi: null };
    const decoded = decodeMultiResult(value);
    if (!("solved" in decoded)) return { timeMs: 0, penalty: "dnf", fmc: null, multi: null };
    // Old-style results have no time (99999 seconds stands for "unknown").
    const cs = decoded.centiseconds ?? 0;
    return { timeMs: cs >= 9_999_900 ? 0 : cs * 10, penalty: "none", fmc: null, multi: { solved: decoded.solved, attempted: decoded.attempted } };
  }
  return { timeMs: dnf ? 0 : value * 10, penalty: dnf ? "dnf" : "none", fmc: null, multi: null };
}

export interface CompetitionInfo {
  name: string;
  startDate: string;
  timeZone: string | null;
  /** Rounds per event, from the WCIF. */
  roundCounts: Map<string, number>;
  place: ReturnType<typeof schedulePlacer> | null;
}

/** What placement needs from a competition's WCIF, or the bare minimum without one. */
export function competitionInfo(wcif: WcifForPlacement | null, wcaId: string, fallback: { name: string; startDate: string }): CompetitionInfo {
  if (!wcif) return { name: fallback.name, startDate: fallback.startDate, timeZone: null, roundCounts: new Map(), place: null };
  return {
    name: wcif.name,
    startDate: wcif.schedule.startDate,
    timeZone: wcif.schedule.venues[0]?.timezone ?? null,
    roundCounts: new Map((wcif.events ?? []).map((e) => [e.id, e.rounds.length])),
    place: schedulePlacer(wcif, wcaId),
  };
}

interface RoundInput {
  competitionId: string;
  eventId: string;
  roundTypeId: string;
  roundNumber: number | null;
  values: number[];
  status: CompetitionAttempt["status"];
  position: number | null;
  roundAverage: number | null;
  singleRecord: string | null;
  averageRecord: string | null;
}

function roundToSolves(round: RoundInput, info: CompetitionInfo, now: number): Solve[] {
  if (!isTimerEvent(round.eventId)) return [];
  const made = round.values.map((value, i) => ({ attempt: i + 1, value: attemptValue(round.eventId, value) })).filter((a) => a.value !== null);
  if (made.length === 0) return [];
  // Times are spread over every attempt in the round, including ones not made, so attempt k stays in its place.
  const placement = info.place?.(round.eventId, round.roundNumber, round.values.length)
    ?? dayPlacement(info.startDate, info.timeZone, round.eventId, round.roundTypeId, round.values.length);

  return made.map(({ attempt, value }) => ({
    id: competitionSolveId(round.competitionId, round.eventId, normalizedRoundType(round.roundTypeId), attempt),
    eventId: round.eventId,
    sessionId: mainSessionId(round.eventId),
    ...value!,
    scramble: "",
    comment: "",
    startedAt: placement.times[attempt - 1],
    endedAt: null,
    source: "competition",
    competition: {
      competitionId: round.competitionId,
      competitionName: info.name,
      roundTypeId: round.roundTypeId,
      attempt,
      status: round.status,
      timeEstimate: placement.estimate,
      roundNumber: round.roundNumber,
      position: round.position,
      roundAverage: round.roundAverage,
      singleRecord: round.singleRecord,
      averageRecord: round.averageRecord,
    },
    memoMs: null,
    entry: "import",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
}

/** Official results for one competition as solves. */
export function officialSolves(results: WcaPersonResult[], info: CompetitionInfo, now: number): Solve[] {
  return results.flatMap((result) => roundToSolves({
    competitionId: result.competition_id,
    eventId: result.event_id,
    roundTypeId: result.round_type_id,
    roundNumber: roundNumberFor(result.round_type_id, info.roundCounts.get(result.event_id) ?? null),
    values: result.attempts,
    status: "official",
    position: result.pos,
    roundAverage: result.average,
    singleRecord: result.regional_single_record,
    averageRecord: result.regional_average_record,
  }, info, now));
}

/** WCA Live results for one competition as solves. The last round is "f"; others are numbered, as official round types are. */
export function liveSolves(competitionId: string, results: WcaLiveResult[], info: CompetitionInfo, now: number): Solve[] {
  return results.flatMap((result) => {
    const eventId = result.round.competitionEvent.event.id;
    const count = info.roundCounts.get(eventId);
    const final = result.round.name.toLowerCase() === "final" || (count !== undefined && result.round.number === count);
    return roundToSolves({
      competitionId,
      eventId,
      roundTypeId: final ? "f" : String(result.round.number),
      roundNumber: result.round.number,
      // Rounds still under way: count the attempts still to come, so times match the official results'.
      values: Array.from({ length: Math.max(result.round.format.numberOfAttempts, result.attempts.length) }, (_, i) => result.attempts[i]?.result ?? 0),
      status: "live",
      position: result.ranking,
      roundAverage: result.average,
      singleRecord: result.singleRecordTag,
      averageRecord: result.averageRecordTag,
    }, info, now);
  });
}

/** Results grouped by competition, in the order they came. */
export function groupByCompetition(results: WcaPersonResult[]): Map<string, WcaPersonResult[]> {
  const groups = new Map<string, WcaPersonResult[]>();
  for (const result of results) {
    const list = groups.get(result.competition_id) ?? [];
    list.push(result);
    groups.set(result.competition_id, list);
  }
  return groups;
}

/** Whether a stored competition solve differs from a freshly fetched one (so it needs saving). */
export function competitionSolveChanged(stored: Solve, fresh: Solve): boolean {
  return stored.timeMs !== fresh.timeMs
    || stored.penalty !== fresh.penalty
    || stored.startedAt !== fresh.startedAt
    || stored.deletedAt !== null
    || JSON.stringify([stored.fmc, stored.multi, stored.competition]) !== JSON.stringify([fresh.fmc, fresh.multi, fresh.competition]);
}

/** A round's WCA average or mean for display: a time, FMC moves to two places, or null when there's none. */
export function formatRoundAverage(eventId: string, value: number | null, precision: "hundredths" | "thousandths" = "hundredths"): string | null {
  if (value === null || value === 0 || value === -2) return null;
  if (value === -1) return "DNF";
  const { kind } = timerEvent(eventId);
  if (kind === "multi-blind") return null;
  if (kind === "fewest-moves") return (value / 100).toFixed(2);
  return formatAverage(value * 10, precision);
}

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
export const ordinal = (n: number): string => {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
};
