// The text a session summary's "Copy" puts on the clipboard, laid out like
// csTimer's session export so it pastes cleanly wherever cubers share times.

import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { localDate } from "@bengottschalk/timer-core/sotd";
import type { SessionSummary } from "@bengottschalk/timer-core/summary";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatSolve, formatValue } from "./format";

interface SessionText {
  name: string;
  eventId: string;
  summary: SessionSummary;
  solves: Solve[];
  precision: Precision;
  /** When it's copied (ms), for the date line. */
  generatedAt: number;
}

/**
 * ```
 * Generated on 2026-11-24
 * ao100 attempt · 3x3x3 Cube
 * Solves/Total: 98/100
 *
 * ao100: 9.05
 * Mean: 9.12 (σ = 1.02)
 * Best: 7.11
 * Worst: 12.30
 * ao5: best 8.20 · worst 10.11
 *
 * Time List:
 * 1. 8.01   R U R' …
 * ```
 */
export function sessionClipboardText({ name, eventId, summary, solves, precision, generatedAt }: SessionText): string {
  const mean = (value: number | null) => formatMean(eventId, value, precision);
  const single = (value: number | null) => formatValue(eventId, value, precision);
  const lines = solves.map((solve, i) => {
    const comment = solve.comment.trim() ? `[${solve.comment.trim().replace(/\s+/g, " ")}]` : "";
    const scramble = solve.scramble.trim().replace(/\s*\n\s*/g, " | ");
    return `${i + 1}. ${formatSolve(solve, precision)}${comment}${scramble ? `   ${scramble}` : ""}`;
  });
  return [
    `Generated on ${localDate(generatedAt)}`,
    `${name} · ${timerEvent(eventId).name}`,
    `Solves/Total: ${summary.solved}/${summary.count}`,
    "",
    ...(summary.full ? [`${summary.full.label}: ${mean(summary.full.value)}`] : []),
    `Mean: ${mean(summary.mean)}${summary.sd === null ? "" : ` (σ = ${mean(summary.sd)})`}`,
    `Best: ${single(summary.best?.value ?? null)}`,
    `Worst: ${single(summary.worst?.value ?? null)}`,
    ...summary.averages.map((a) => `${a.label}: best ${mean(a.best?.value ?? null)} · worst ${mean(a.worst?.value ?? null)}`),
    "",
    "Time List:",
    ...lines,
  ].join("\n");
}
