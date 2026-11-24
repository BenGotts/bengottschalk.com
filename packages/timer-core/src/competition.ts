// Competition attempts from the WCA, as solves in each event's main session.
//
// Official results come from the WCA API (`v1/persons/{id}/results`); while a
// competition is on, WCA Live has them first. Each attempt gets a fixed id
// (see `competitionSolveId`) from the competition, event, round and attempt,
// so refreshing updates the same solve and official results replace live ones.
//
// The WCA doesn't record when an attempt happened, so `startedAt` is worked
// out, best source first:
//   1. WCA Live (see `liveCompetitionInfo`): when the person's result was
//      entered, within their group's slot ("entered");
//   2. the person's group slot ("group"), from WCA Live or the public WCIF;
//   3. the round's slot ("round");
//   4. midday on the competition's first day, in the venue's time zone or
//      else the person's ("day").
// That puts them among home solves at about the right moment. Every time
// from the WCA is UTC and is read as such (see zone.ts).

import { decodeMultiResult } from "@wca/helpers";
import { CURRENT_EVENT_IDS } from "@bengottschalk/wca/events";
import { isTimerEvent, timerEvent } from "./events";
import { mainSessionId } from "./sessions";
import { competitionSolveId, type CompetitionAttempt, type Solve } from "./solve";
import { formatAverage } from "./time";
import { parseInstant, zonedTime } from "./zone";

export { zonedTime } from "./zone";

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
  /** When the result was entered on WCA Live (UTC ISO), if it says. */
  enteredAt?: string | null;
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

export interface Placement {
  times: number[];
  estimate: CompetitionAttempt["timeEstimate"];
}

/** A scheduled slot (a round, a group or one attempt), as milliseconds since 1970. */
export interface Slot {
  code: string;
  start: number;
  end: number;
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
/** A WCIF activity as a slot; null if its times don't say their offset. */
function asSlot(activity: WcifActivity): Slot | null {
  const start = parseInstant(activity.startTime);
  const end = parseInstant(activity.endTime);
  return start === null || end === null ? null : { code: activity.activityCode, start, end };
}

/** Results are usually entered within minutes of the group; later than this after it, the entry time says nothing about the attempts. */
const ENTRY_SLACK_MS = 30 * 60_000;
/** With no slot at all, attempts entered together are placed this far apart, ending at the entry. */
const ATTEMPT_GAP_MS = 2 * 60_000;

/**
 * Places one round's attempts from the schedule slots and, when known, the
 * moment the result was entered. Shared by the WCIF and WCA Live paths.
 */
function placeRound(
  { activities, groups, round, count, enteredAt }: { activities: Slot[]; groups: Slot[]; round: string; count: number; enteredAt: number | null },
): Placement | null {
  // FMC and Multi-Blind schedule each attempt (`333fm-r1-a2`): one attempt per slot.
  const attemptSlots = Array.from({ length: count }, (_, i) => activities.find((a) => a.code === `${round}-a${i + 1}`));
  if (attemptSlots.every((a) => a !== undefined)) {
    return { times: attemptSlots.map((a) => spread(a!.start, a!.end, 1)[0]), estimate: "group" };
  }

  const group = groups.find((a) => a.code.startsWith(`${round}-g`));
  const roundSlots = activities.filter((a) => a.code === round);
  const slot = group ?? (roundSlots.length > 0
    ? { code: round, start: Math.min(...roundSlots.map((a) => a.start)), end: Math.max(...roundSlots.map((a) => a.end)) }
    : null);

  if (enteredAt !== null) {
    if (slot && enteredAt > slot.start && enteredAt <= slot.end + ENTRY_SLACK_MS) {
      // The attempts were done in the slot, and before the result was entered.
      return { times: spread(slot.start, Math.min(slot.end, enteredAt), count), estimate: "entered" };
    }
    if (!slot) {
      return { times: Array.from({ length: count }, (_, i) => enteredAt - (count - i) * ATTEMPT_GAP_MS), estimate: "entered" };
    }
  }
  if (slot) return { times: spread(slot.start, slot.end, count), estimate: group ? "group" : "round" };
  return null;
}

type Placer = (eventId: string, roundNumber: number | null, count: number) => Placement | null;

export function schedulePlacer(wcif: WcifForPlacement, wcaId: string): Placer {
  const all = allActivities(wcif);
  const activities = all.map(asSlot).filter((a): a is Slot => a !== null);
  const byId = new Map(all.map((a) => [a.id, a]));
  const person = wcif.persons.find((p) => p.wcaId === wcaId);
  const groups = (person?.assignments ?? [])
    .filter((a) => a.assignmentCode === "competitor")
    .map((a) => byId.get(a.activityId))
    .map((a) => (a ? asSlot(a) : null))
    .filter((a): a is Slot => a !== null);

  return (eventId, roundNumber, count) => {
    if (roundNumber === null || count === 0) return null;
    return placeRound({ activities, groups, round: `${eventId}-r${roundNumber}`, count, enteredAt: null });
  };
}

// ---------------------------------------------------------------------------
// WCA Live

/** A competition's schedule as captured from WCA Live (all times in milliseconds since 1970). */
export interface WcaLiveSchedule {
  /** WCA Live's own id for the competition. */
  liveId: string;
  name: string;
  /** First and last day, in the venue's time zone. */
  startDate: string;
  endDate: string;
  /** The (first) venue's IANA time zone. */
  timeZone: string | null;
  /** When the first activity starts and the last one ends. */
  start: number | null;
  end: number | null;
  /** Rounds per event. */
  roundCounts: Record<string, number>;
  /** Every scheduled activity: rounds, groups (`333-r1-g2`) and single attempts (`333fm-r1-a1`). */
  activities: Slot[];
}

/** What's kept from WCA Live for a competition: the schedule, and per WCA ID their groups and when their results were entered. */
export interface WcaLiveCapture {
  schedule: WcaLiveSchedule;
  /** Each competitor's groups (competing assignments only). */
  assignments: Record<string, Slot[]>;
  /** Each competitor's result entry times, by round (`333-r1`). */
  enteredAt: Record<string, Record<string, number>>;
}

/** The round key used in `WcaLiveCapture.enteredAt`. */
export const liveRoundKey = (eventId: string, roundNumber: number) => `${eventId}-r${roundNumber}`;

/** Places a person's attempts from a WCA Live capture: entry time within their group, then group, then round. */
export function livePlacer(capture: WcaLiveCapture, wcaId: string): Placer {
  const groups = capture.assignments[wcaId] ?? [];
  const entered = capture.enteredAt[wcaId] ?? {};
  return (eventId, roundNumber, count) => {
    if (roundNumber === null || count === 0) return null;
    const round = liveRoundKey(eventId, roundNumber);
    return placeRound({ activities: capture.schedule.activities, groups, round, count, enteredAt: entered[round] ?? null });
  };
}

/** What placement needs, from a WCA Live capture. */
export function liveCompetitionInfo(capture: WcaLiveCapture, wcaId: string, fallbackTimeZone: string | null = null): CompetitionInfo {
  return {
    name: capture.schedule.name,
    startDate: capture.schedule.startDate,
    timeZone: capture.schedule.timeZone ?? fallbackTimeZone,
    roundCounts: new Map(Object.entries(capture.schedule.roundCounts)),
    place: livePlacer(capture, wcaId),
  };
}

/** A capture reduced to one competitor (what their browser needs). */
export const liveCaptureFor = (capture: WcaLiveCapture, wcaId: string): WcaLiveCapture => ({
  schedule: capture.schedule,
  assignments: capture.assignments[wcaId] ? { [wcaId]: capture.assignments[wcaId] } : {},
  enteredAt: capture.enteredAt[wcaId] ? { [wcaId]: capture.enteredAt[wcaId] } : {},
});

/** Adds result entry times from fresh WCA Live results (newer than the capture's) for one competitor. */
export function withEnteredAt(capture: WcaLiveCapture, wcaId: string, results: WcaLiveResult[]): WcaLiveCapture {
  const entered = { ...capture.enteredAt[wcaId] };
  for (const result of results) {
    const at = result.enteredAt ? parseInstant(result.enteredAt) : null;
    if (at !== null) entered[liveRoundKey(result.round.competitionEvent.event.id, result.round.number)] = at;
  }
  return { ...capture, enteredAt: { ...capture.enteredAt, [wcaId]: entered } };
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

/**
 * What placement needs from a competition's WCIF, or the bare minimum without
 * one. `fallback.timeZone` (the person's) is used for "day" placement when the
 * venue's zone isn't known.
 */
export function competitionInfo(wcif: WcifForPlacement | null, wcaId: string, fallback: { name: string; startDate: string; timeZone?: string | null }): CompetitionInfo {
  if (!wcif) return { name: fallback.name, startDate: fallback.startDate, timeZone: fallback.timeZone ?? null, roundCounts: new Map(), place: null };
  return {
    name: wcif.name,
    startDate: wcif.schedule.startDate,
    timeZone: wcif.schedule.venues[0]?.timezone ?? fallback.timeZone ?? null,
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
    || stableJson([stored.fmc, stored.multi, stored.competition]) !== stableJson([fresh.fmc, fresh.multi, fresh.competition]);
}

/** JSON with object keys sorted, so the same data compares equal whatever order its keys were stored in (Postgres jsonb reorders them). */
function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).toSorted(([a], [b]) => a.localeCompare(b))) : v);
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
