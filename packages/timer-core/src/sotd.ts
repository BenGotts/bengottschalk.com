// Solve of the Day: at most one solve per event per calendar day (a 3x3 and a
// Square-1 Solve of the Day can share a day). Marks are kept apart
// from solves, so a competition attempt (which is read-only) can be marked,
// and refreshing results from the WCA keeps the mark.

import { rawTimeKnown, type Solve } from "./solve";
import { formatAverage, formatTime, type Precision } from "./time";
import { timerEvent } from "./events";
import { formatRoundAverage, ordinal, roundName } from "./competition";
import { localDate } from "./zone";

export interface SotdMark {
  /** The marked solve's event: each event has its own Solve of the Day. */
  eventId: string;
  /** The local calendar day, `YYYY-MM-DD`: the day the solve was done. */
  date: string;
  solveId: string;
  updatedAt: number;
  /** Unmarking keeps the record (marked as deleted) so it syncs. */
  deletedAt: number | null;
}

/** The calendar day of a moment, `YYYY-MM-DD`, in the given zone or this runtime's own (the person's, in a browser). */
export { localDate } from "./zone";

/** The key a mark is stored under: one Solve of the Day per event per day. */
export const sotdKey = (eventId: string, date: string): string => `${eventId}/${date}`;

/** The Solve of the Day for each event and day (keyed by `sotdKey`), from the marks that are still set. */
export function sotdByEventDay(marks: readonly SotdMark[]): Map<string, string> {
  return new Map(marks.filter((mark) => mark.deletedAt === null).map((mark) => [sotdKey(mark.eventId, mark.date), mark.solveId]));
}

/** A mark as saved before each event had its own Solve of the Day: no `eventId`. */
export type DatedSotdMark = Omit<SotdMark, "eventId"> & { eventId?: string };

/**
 * Gives older marks their event: the marked solve's (`eventOf`). A mark whose
 * solve isn't known is dropped, since it couldn't be shown anyway. Should two
 * old marks end up with the same event and day, the newer edit is kept.
 */
export function withMarkEvents<T extends DatedSotdMark>(marks: readonly T[], eventOf: (solveId: string) => string | undefined): (T & { eventId: string })[] {
  const byKey = new Map<string, T & { eventId: string }>();
  for (const mark of marks) {
    const eventId = mark.eventId ?? eventOf(mark.solveId);
    if (eventId === undefined) continue;
    const key = sotdKey(eventId, mark.date);
    const existing = byKey.get(key);
    if (!existing || mark.updatedAt > existing.updatedAt) byKey.set(key, { ...mark, eventId });
  }
  return [...byKey.values()];
}

/** What to ask before another solve of the same event takes over a day's Solve of the Day. */
export function sotdReplaceQuestion(eventId: string, day: "today" | "this day"): string {
  return `Another ${timerEvent(eventId).shortName} solve is already Solve of the Day for ${day}. Replace it with this one?`;
}

export interface SotdDetails {
  solve: Solve;
  /** Session stats at the moment of the solve, worked out by the caller from the solves before it. */
  ao5: number | null;
  ao12: number | null;
  wasPersonalBest: boolean;
  sessionName: string;
}

/** The text "Copy for Claude" puts on the clipboard, for the Solve of the Day skill. */
export function sotdClipboardText({ solve, ao5, ao12, wasPersonalBest, sessionName }: SotdDetails, precision: Precision): string {
  const event = timerEvent(solve.eventId);
  // A DNF shows the time it was stopped at when there is one (the WCA records none for its DNFs).
  const time = solve.penalty === "dnf"
    ? (rawTimeKnown(solve) ? `DNF (${formatTime(solve.timeMs, precision)})` : "DNF")
    : formatTime(solve.timeMs + (solve.penalty === "+2" ? 2000 : 0), precision) + (solve.penalty === "+2" ? " (+2)" : "");
  const lines = [
    "Solve of the Day",
    `Date: ${localDate(solve.startedAt)}`,
    `Event: ${event.name}`,
    event.kind === "fewest-moves" && solve.fmc ? `Result: ${solve.fmc.moves} moves` : `Time: ${time}`,
  ];
  const comp = solve.competition;
  if (comp) {
    lines.push(
      `Competition: ${comp.competitionName} (${comp.competitionId})`,
      `Round: ${roundName(comp.roundTypeId)}, attempt ${comp.attempt}`,
    );
    if (comp.position !== null) lines.push(`Placed: ${ordinal(comp.position)}${comp.status === "live" ? " (live, not yet official)" : ""}`);
    const average = formatRoundAverage(solve.eventId, comp.roundAverage, precision);
    if (average) lines.push(`Round ${event.format === "mo3" ? "mean" : "average"}: ${average}`);
    const records = [comp.singleRecord && `${comp.singleRecord} single`, comp.averageRecord && `${comp.averageRecord} average`].filter(Boolean);
    if (records.length > 0) lines.push(`Records: ${records.join(", ")}`);
  }
  if (solve.multi) lines.push(`Cubes: ${solve.multi.solved}/${solve.multi.attempted}`);
  if (solve.memoMs !== null) lines.push(`Memo: ${formatTime(solve.memoMs, precision)}`);
  lines.push(`Scramble: ${solve.scramble || (comp ? "not known (the WCA doesn't say which scramble set a competitor had)" : "")}`);
  if (solve.fmc) lines.push(`Solution: ${solve.fmc.solution}`);
  if (!comp) {
    if (ao5 !== null) lines.push(`ao5: ${formatAverage(ao5, precision)}`);
    if (ao12 !== null) lines.push(`ao12: ${formatAverage(ao12, precision)}`);
    if (wasPersonalBest) lines.push("Personal best single");
    lines.push(`Session: ${sessionName}`);
  }
  if (solve.endedAt !== null) {
    lines.push(`Started: ${new Date(solve.startedAt).toISOString()}`, `Stopped: ${new Date(solve.endedAt).toISOString()}`);
  }
  if (solve.comment.trim()) lines.push(`Comment: ${solve.comment.trim()}`);
  return lines.join("\n");
}
