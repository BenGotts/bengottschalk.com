"use client";

import type { EventFormat } from "@bengottschalk/timer-core/events";
import { multiBlindStats } from "@bengottschalk/timer-core/multi";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { averageBreakdown, averageLabel, type AverageSpec, type SessionStats } from "@bengottschalk/timer-core/stats";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatMultiResult, formatSolve, multiPointsText } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  stats: SessionStats;
  /** Which averages to show (from settings), in order. */
  specs: AverageSpec[];
  /** The solves the stats are worked out from, oldest first. */
  solves: Solve[];
  precision: Precision;
  /** Opens the solves in an average ending at `end`. */
  onOpenAverage: (spec: AverageSpec, end: number) => void;
  /** Opens one solve by its index. */
  onOpenSolve: (index: number) => void;
}

/** The average the recent solves make up: an ao5, or a mo3 for mean-of-3 events. */
const recentSpec = (format: EventFormat): AverageSpec => (format === "mo3" ? { kind: "mean", size: 3 } : { kind: "average", size: 5 });

/**
 * Phones: the stats under the timer, as two lists side by side. The recent
 * solves, newest first: the last five for ao5 events (once there are five, the
 * ao5's dropped best and worst in brackets, green and red), the last three for
 * mo3 events (a mean drops nothing, so no brackets). A time opens its solve,
 * the heading opens the ao5 or mo3. Beside them, the averages chosen in
 * settings and the mean with their bests. Multi-Blind has no averages: its
 * last five, then its best result, points and successes, and no brackets. Wide screens have all this in the sidebar instead.
 */
export default function ScreenStats({ eventId, format, stats, specs, solves, precision, onOpenAverage, onOpenSolve }: Props) {
  const recentAverage = recentSpec(format);
  const recent = solves.slice(-recentAverage.size);
  const full = recent.length === recentAverage.size && format !== "best";
  const averages = specs.flatMap((spec) => {
    const average = stats.averages.find((a) => a.label === averageLabel(spec));
    return average ? [average] : [];
  });
  // Brackets only once there's a full ao5 to drop from (a mean drops nothing; single-result events have no average).
  const dropped = full && recentAverage.kind === "average" ? averageBreakdown(recent.map(solveValue), "average").dropped : recent.map(() => null);
  const first = stats.count - recent.length;
  const newestFirst = recent.map((solve, i) => ({ solve, index: first + i, end: dropped[i] })).toReversed();

  return (
    <div className="grid grid-cols-2 gap-2 lg:hidden" aria-label="Stats">
      <section className="rounded-box bg-base-200 px-2.5 py-1.5">
        <div className="flex justify-between gap-2 text-xs text-muted">
          <h2>{full ? <button type="button" className="link-hover" onClick={() => onOpenAverage(recentAverage, stats.count - 1)}>Last {recentAverage.size}</button> : `Last ${recentAverage.size}`}</h2>
          <span className="truncate">{stats.count.toLocaleString()} {stats.count === 1 ? "solve" : "solves"}</span>
        </div>
        <ol className="timer-digits text-sm">
          {newestFirst.length === 0 && <li className="text-muted">–</li>}
          {newestFirst.map(({ solve, index, end }) => {
            const time = formatSolve(solve, precision);
            return (
              <li key={solve.id} className="flex items-baseline gap-2 leading-6 [@media(max-height:700px)]:leading-5">
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
      {format === "best" ? <MultiBlindStats solves={solves} precision={precision} onOpenSolve={onOpenSolve} /> : <section className="rounded-box bg-base-200 px-2.5 py-1.5">
        <div className="flex justify-between text-xs text-muted"><h2>Averages</h2><span aria-hidden>best</span></div>
        <table className="timer-digits w-full text-sm">
          <thead className="sr-only">
            <tr><th scope="col">Average</th><th scope="col">Current</th><th scope="col">Best</th></tr>
          </thead>
          <tbody>
            {averages.map(({ label, spec, current, best, bestEnd }) => (
              <tr key={label} className="leading-6 [@media(max-height:700px)]:leading-5">
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
            <tr className="leading-6 [@media(max-height:700px)]:leading-5">
              <th scope="row" className="pr-2 text-left text-xs font-normal text-muted">mean</th>
              <td>{formatMean(eventId, stats.mean, precision)}</td>
              <td aria-hidden />
            </tr>
          </tbody>
        </table>
      </section>}
    </div>
  );
}

/** Multi-Blind's side: the best result (WCA ranking), its points, and how many attempts counted. */
function MultiBlindStats({ solves, precision, onOpenSolve }: { solves: Solve[]; precision: Precision; onOpenSolve: (index: number) => void }) {
  const { bestIndex, successes, attempts, meanPoints } = multiBlindStats(solves);
  const best = bestIndex === null ? null : { solve: solves[bestIndex], index: bestIndex };
  const row = "flex items-baseline justify-between gap-2 leading-6 [@media(max-height:700px)]:leading-5";
  return (
    <section className="rounded-box bg-base-200 px-2.5 py-1.5">
      <h2 className="text-xs text-muted">Results</h2>
      <dl className="timer-digits text-sm">
        <div className={row}>
          <dt className="text-xs text-muted">best</dt>
          <dd className="min-w-0 truncate">{best ? <button type="button" className="link-hover" onClick={() => onOpenSolve(best.index)}>{formatMultiResult(best.solve, precision)}</button> : "–"}</dd>
        </div>
        <div className={row}><dt className="text-xs text-muted">points</dt><dd>{best ? multiPointsText(best.solve) : "–"}</dd></div>
        <div className={row}><dt className="text-xs text-muted">mean pts</dt><dd>{meanPoints === null ? "–" : meanPoints.toFixed(2)}</dd></div>
        <div className={row}><dt className="text-xs text-muted">successes</dt><dd>{successes}/{attempts}</dd></div>
      </dl>
    </section>
  );
}
