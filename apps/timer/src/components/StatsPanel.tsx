"use client";

import type { AverageSpec, SessionStats } from "@bengottschalk/timer-core/stats";
import type { EventFormat } from "@bengottschalk/timer-core/events";
import { multiBlindStats } from "@bengottschalk/timer-core/multi";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatMultiResult, formatValue, multiPointsText } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  stats: SessionStats;
  /** The solves the stats are worked out from, oldest first (Multi-Blind's stats come from them). */
  solves: Solve[];
  precision: Precision;
  /** Opens the solves in an average ending at `end`. */
  onOpenAverage: (spec: AverageSpec, end: number) => void;
  /** Opens one solve by its index. */
  onOpenSolve: (index: number) => void;
}

/** A stat value that opens what it's made of, when there's something to open. */
function Value({ text, onClick }: { text: string; onClick: (() => void) | null }) {
  return onClick ? <button type="button" className="link-hover" onClick={onClick}>{text}</button> : <>{text}</>;
}

export default function StatsPanel({ eventId, format, stats, solves, precision, onOpenAverage, onOpenSolve }: Props) {
  if (format === "best") return <MultiBlindPanel solves={solves} precision={precision} onOpenSolve={onOpenSolve} />;
  const { bestIndex } = stats;
  // Mean-of-3 events lead with mo3; the rest lead with ao5.
  const averages = stats.averages.filter((a) => (format === "mo3" ? true : a.label !== "mo3") && (a.spec.size <= 12 || stats.count >= a.spec.size));

  return (
    <div className="rounded-box bg-base-200 p-3 text-sm">
      <div className="mb-2 flex justify-between text-muted">
        <span>{stats.count} {stats.count === 1 ? "solve" : "solves"}{stats.count !== stats.solved && ` · ${stats.count - stats.solved} DNF`}</span>
        <span>mean <span className="timer-digits text-base-content">{formatMean(eventId, stats.mean, precision)}</span></span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="font-normal" scope="col"><span className="sr-only">Stat</span></th>
            <th className="font-normal" scope="col">current</th>
            <th className="font-normal" scope="col">best</th>
          </tr>
        </thead>
        <tbody className="timer-digits">
          <tr>
            <th scope="row" className="py-0.5 text-left font-normal text-muted">single</th>
            <td><Value text={formatValue(eventId, stats.last, precision)} onClick={stats.count === 0 ? null : () => onOpenSolve(stats.count - 1)} /></td>
            <td><Value text={formatValue(eventId, stats.best, precision)} onClick={bestIndex === null ? null : () => onOpenSolve(bestIndex)} /></td>
          </tr>
          {averages.map(({ label, spec, current, best, bestEnd }) => (
            <tr key={label}>
              <th scope="row" className="py-0.5 text-left font-normal text-muted">{label}</th>
              <td><Value text={formatMean(eventId, current, precision)} onClick={current === null ? null : () => onOpenAverage(spec, stats.count - 1)} /></td>
              <td><Value text={formatMean(eventId, best, precision)} onClick={bestEnd === null ? null : () => onOpenAverage(spec, bestEnd)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Multi-Blind: no averages, just results. The best by WCA ranking (more
 * points, then less time, then fewer missed), the latest, the mean points of
 * the attempts that counted, and cubes solved overall.
 */
function MultiBlindPanel({ solves, precision, onOpenSolve }: { solves: Solve[]; precision: Precision; onOpenSolve: (index: number) => void }) {
  const { attempts, successes, bestIndex, meanPoints, cubesSolved, cubesAttempted } = multiBlindStats(solves);
  const result = (index: number | null) => {
    if (index === null) return <span className="text-muted">–</span>;
    const solve = solves[index];
    const points = multiPointsText(solve);
    return (
      <button type="button" className="link-hover text-left" onClick={() => onOpenSolve(index)}>
        {formatMultiResult(solve, precision)}{points && <span className="text-muted"> · {points}</span>}
      </button>
    );
  };
  return (
    <div className="rounded-box bg-base-200 p-3 text-sm">
      <div className="mb-2 flex justify-between text-muted">
        <span>{attempts} {attempts === 1 ? "attempt" : "attempts"}{attempts !== successes && ` · ${attempts - successes} DNF`}</span>
        <span>mean <span className="timer-digits text-base-content">{meanPoints === null ? "–" : `${meanPoints.toFixed(2)} pts`}</span></span>
      </div>
      <table className="w-full">
        <tbody className="timer-digits">
          <tr><th scope="row" className="w-16 py-0.5 text-left font-normal text-muted">best</th><td>{result(bestIndex)}</td></tr>
          <tr><th scope="row" className="py-0.5 text-left font-normal text-muted">last</th><td>{result(attempts > 0 ? attempts - 1 : null)}</td></tr>
          <tr><th scope="row" className="py-0.5 text-left font-normal text-muted">cubes</th><td>{attempts > 0 ? `${cubesSolved}/${cubesAttempted} solved` : <span className="text-muted">–</span>}</td></tr>
        </tbody>
      </table>
    </div>
  );
}
