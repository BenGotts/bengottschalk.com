import { timerEvent } from "@bengottschalk/timer-core/events";
import { multiBlindResultPoints, multiBlindTimeMs } from "@bengottschalk/timer-core/multi";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { formatAverage, formatClockTime, formatTime, type Precision } from "@bengottschalk/timer-core/time";

/**
 * A Multi-Blind result: cubes and time, like `6/7 54:12.34` or
 * `9/10 1:02:03.45` (just `6/7` when the time isn't known). Competition
 * results are only timed to the second, so they show `57:36`. A DNF keeps
 * what it was in brackets: `DNF (2/7 58:01.20)`.
 */
export function formatMultiResult(solve: Pick<Solve, "multi" | "timeMs" | "penalty" | "source">, precision: Precision): string {
  if (!solve.multi) return "DNF";
  const ms = multiBlindTimeMs(solve);
  const time = ms === null ? "" : ` ${formatClockTime(ms, precision, { wholeSeconds: solve.source === "competition" })}`;
  const result = `${solve.multi.solved}/${solve.multi.attempted}${time}`;
  return multiBlindResultPoints(solve) === null ? `DNF (${result})` : result;
}

/** `5 pts`, `1 pt`, `0 pts`. */
export const formatPoints = (points: number): string => `${points} ${Math.abs(points) === 1 ? "pt" : "pts"}`;

/** A Multi-Blind attempt's points as text, or null for a DNF (which scores none). */
export function multiPointsText(solve: Pick<Solve, "multi" | "penalty">): string | null {
  const points = multiBlindResultPoints(solve);
  return points === null ? null : formatPoints(points);
}

/** A solve's result for lists: `12.34`, `14.34+`, `DNF`, `28` moves, or `6/7 54:12.34`. */
export function formatSolve(solve: Solve, precision: Precision): string {
  const { kind } = timerEvent(solve.eventId);
  if (kind === "fewest-moves") return solve.penalty === "dnf" || !solve.fmc ? "DNF" : String(solve.fmc.moves);
  if (kind === "multi-blind") return formatMultiResult(solve, precision);
  if (solve.penalty === "dnf") return "DNF";
  if (solve.penalty === "+2") return `${formatTime(solve.timeMs + 2000, precision)}+`;
  return formatTime(solve.timeMs, precision);
}

/** A solve's result with Multi-Blind's points after it (`6/7 54:12.34 · 5 pts`), for copied text and titles. */
export function formatSolveWithPoints(solve: Solve, precision: Precision): string {
  const result = formatSolve(solve, precision);
  if (timerEvent(solve.eventId).kind !== "multi-blind") return result;
  const points = multiPointsText(solve);
  return points ? `${result} · ${points}` : result;
}

/** A single stat value (best, worst) for an event: a time, or moves for FMC. */
export function formatValue(eventId: string, value: number | null, precision: Precision): string {
  if (value === null) return "–";
  if (!Number.isFinite(value)) return "DNF";
  return timerEvent(eventId).kind === "fewest-moves" ? String(value) : formatTime(value, precision);
}

/** An average or mean for an event: a time, or moves to two places for FMC. */
export function formatMean(eventId: string, value: number | null, precision: Precision): string {
  if (value === null) return "–";
  if (!Number.isFinite(value)) return "DNF";
  return timerEvent(eventId).kind === "fewest-moves" ? value.toFixed(2) : formatAverage(value, precision);
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export const formatDateTime = (ms: number) => dateTime.format(ms);

/** `"2026-11-23"` → a local date label. */
export const formatDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return dateOnly.format(new Date(y, m - 1, d));
};
