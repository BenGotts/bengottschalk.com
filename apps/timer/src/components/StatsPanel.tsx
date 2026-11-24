"use client";

import type { AverageSpec, SessionStats } from "@bengottschalk/timer-core/stats";
import type { EventFormat } from "@bengottschalk/timer-core/events";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatValue } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  stats: SessionStats;
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

export default function StatsPanel({ eventId, format, stats, precision, onOpenAverage, onOpenSolve }: Props) {
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
          {format !== "best" && averages.map(({ label, spec, current, best, bestEnd }) => (
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
