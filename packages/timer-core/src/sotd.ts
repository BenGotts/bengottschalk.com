// Solve of the Day: at most one solve per calendar day. Marks are kept apart
// from solves, so a competition attempt (which is read-only) can be marked,
// and refreshing results from the WCA keeps the mark.

import type { Solve } from "./solve";
import { formatAverage, formatTime, type Precision } from "./time";
import { timerEvent } from "./events";

export interface SotdMark {
  /** The local calendar day, `YYYY-MM-DD`: the day the solve was done. */
  date: string;
  solveId: string;
  updatedAt: number;
  /** Unmarking keeps the record (marked as deleted) so it syncs. */
  deletedAt: number | null;
}

/** The local calendar day of a moment, `YYYY-MM-DD`. */
export function localDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The Solve of the Day for each day, from the marks that are still set. */
export function sotdByDate(marks: readonly SotdMark[]): Map<string, string> {
  return new Map(marks.filter((mark) => mark.deletedAt === null).map((mark) => [mark.date, mark.solveId]));
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
export function sotdClipboardText({ solve, ao5, ao12, wasPersonalBest, sessionName }: SotdDetails, precision: Precision = "thousandths"): string {
  const event = timerEvent(solve.eventId);
  const time = solve.penalty === "dnf"
    ? `DNF (${formatTime(solve.timeMs, precision)})`
    : formatTime(solve.timeMs + (solve.penalty === "+2" ? 2000 : 0), precision) + (solve.penalty === "+2" ? " (+2)" : "");
  const lines = [
    "Solve of the Day",
    `Date: ${localDate(solve.startedAt)}`,
    `Event: ${event.name}`,
    event.kind === "fewest-moves" && solve.fmc ? `Result: ${solve.fmc.moves} moves` : `Time: ${time}`,
  ];
  if (solve.multi) lines.push(`Cubes: ${solve.multi.solved}/${solve.multi.attempted}`);
  if (solve.memoMs !== null) lines.push(`Memo: ${formatTime(solve.memoMs, precision)}`);
  lines.push(`Scramble: ${solve.scramble}`);
  if (solve.fmc) lines.push(`Solution: ${solve.fmc.solution}`);
  if (ao5 !== null) lines.push(`ao5: ${formatAverage(ao5, precision)}`);
  if (ao12 !== null) lines.push(`ao12: ${formatAverage(ao12, precision)}`);
  if (wasPersonalBest) lines.push("Personal best single");
  lines.push(`Session: ${sessionName}`);
  if (solve.endedAt !== null) {
    lines.push(`Started: ${new Date(solve.startedAt).toISOString()}`, `Stopped: ${new Date(solve.endedAt).toISOString()}`);
  }
  if (solve.comment.trim()) lines.push(`Comment: ${solve.comment.trim()}`);
  return lines.join("\n");
}
