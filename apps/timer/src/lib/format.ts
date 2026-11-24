import { timerEvent } from "@bengottschalk/timer-core/events";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { formatAverage, formatTime, type Precision } from "@bengottschalk/timer-core/time";

/** A solve's result for lists: `12.34`, `14.34+`, `DNF`, `28` moves, or `5/6 45:12`. */
export function formatSolve(solve: Solve, precision: Precision): string {
  const { kind } = timerEvent(solve.eventId);
  if (kind === "fewest-moves") return solve.penalty === "dnf" || !solve.fmc ? "DNF" : String(solve.fmc.moves);
  if (kind === "multi-blind") {
    const value = solveValue(solve);
    const cubes = solve.multi ? `${solve.multi.solved}/${solve.multi.attempted} ` : "";
    return Number.isFinite(value) ? `${cubes}${formatTime(value, precision)}` : "DNF";
  }
  if (solve.penalty === "dnf") return "DNF";
  if (solve.penalty === "+2") return `${formatTime(solve.timeMs + 2000, precision)}+`;
  return formatTime(solve.timeMs, precision);
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
