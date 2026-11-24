"use client";

import type { EventFormat } from "@bengottschalk/timer-core/events";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { averageBreakdown, type AverageSpec, type SessionStats } from "@bengottschalk/timer-core/stats";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatSolve } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  stats: SessionStats;
  precision: Precision;
  /** Up to the last five solves, oldest first. */
  recent: Solve[];
  /** Opens the solves in an average ending at `end`. */
  onOpenAverage: (spec: AverageSpec, end: number) => void;
  /** Opens one solve by its index. */
  onOpenSolve: (index: number) => void;
}

/** Which averages lead for each event format, in order. */
const LEAD: Record<EventFormat, string[]> = {
  ao5: ["ao5", "ao12", "ao100"],
  mo3: ["mo3", "ao5", "ao12"],
  best: ["mo3", "ao5", "ao12"],
};

const FIVE: AverageSpec = { kind: "average", size: 5 };

/**
 * Phones: the stats under the timer, as two lists side by side. The last five
 * solves, newest first (once there are five, the ao5's dropped best and worst
 * in brackets, green and red; a time opens its solve, the heading opens the
 * ao5), and the leading averages and mean with their bests. Wide screens
 * have all this in the sidebar instead.
 */
export default function ScreenStats({ eventId, format, stats, precision, recent, onOpenAverage, onOpenSolve }: Props) {
  const averages = LEAD[format].flatMap((label) => {
    const average = stats.averages.find((a) => a.label === label);
    return average && (average.spec.size < 100 || stats.count >= average.spec.size) ? [average] : [];
  });
  // Brackets only once there's a full ao5 to drop from.
  const dropped = recent.length === 5 ? averageBreakdown(recent.map(solveValue), "average").dropped : recent.map(() => null);
  const first = stats.count - recent.length;
  const newestFirst = recent.map((solve, i) => ({ solve, index: first + i, end: dropped[i] })).toReversed();

  return (
    <div className="grid grid-cols-2 gap-2 lg:hidden" aria-label="Stats">
      <section className="rounded-box bg-base-200 px-2.5 py-1.5">
        <div className="flex justify-between gap-2 text-xs text-muted">
          <h2>{recent.length === 5 ? <button type="button" className="link-hover" onClick={() => onOpenAverage(FIVE, stats.count - 1)}>Last 5</button> : "Last 5"}</h2>
          <span className="truncate">{stats.count.toLocaleString()} {stats.count === 1 ? "solve" : "solves"}</span>
        </div>
        <ol className="timer-digits text-sm">
          {newestFirst.length === 0 && <li className="text-muted">–</li>}
          {newestFirst.map(({ solve, index, end }) => {
            const time = formatSolve(solve, precision);
            return (
              <li key={solve.id} className="flex items-baseline gap-2 leading-6">
                <span className="w-8 shrink-0 text-right text-xs text-muted">{index + 1}.</span>
                <button
                  type="button"
                  className={`link-hover min-w-0 truncate text-left ${end === "best" ? "text-success" : end === "worst" ? "text-error" : solve.competition ? "text-ink-gold" : ""}`}
                  onClick={() => onOpenSolve(index)}
                >
                  {end ? `(${time})` : time}
                </button>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="rounded-box bg-base-200 px-2.5 py-1.5">
        <div className="flex justify-between text-xs text-muted"><h2>Averages</h2><span aria-hidden>best</span></div>
        <table className="timer-digits w-full text-sm">
          <thead className="sr-only">
            <tr><th scope="col">Average</th><th scope="col">Current</th><th scope="col">Best</th></tr>
          </thead>
          <tbody>
            {averages.map(({ label, spec, current, best, bestEnd }) => (
              <tr key={label} className="leading-6">
                <th scope="row" className="pr-2 text-left text-xs font-normal text-muted">{label}</th>
                <td>
                  {current === null ? formatMean(eventId, null, precision) : (
                    <button type="button" className="link-hover" onClick={() => onOpenAverage(spec, stats.count - 1)}>{formatMean(eventId, current, precision)}</button>
                  )}
                </td>
                <td className="text-right text-xs text-muted">
                  {bestEnd === null ? "" : (
                    <button type="button" className="link-hover" onClick={() => onOpenAverage(spec, bestEnd)} aria-label={`Best ${label}`}>{formatMean(eventId, best, precision)}</button>
                  )}
                </td>
              </tr>
            ))}
            <tr className="leading-6">
              <th scope="row" className="pr-2 text-left text-xs font-normal text-muted">mean</th>
              <td>{formatMean(eventId, stats.mean, precision)}</td>
              <td aria-hidden />
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
