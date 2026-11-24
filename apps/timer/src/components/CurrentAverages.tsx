"use client";

import type { EventFormat } from "@bengottschalk/timer-core/events";
import { multiBlindStats } from "@bengottschalk/timer-core/multi";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { averageLabel, type AverageSpec, type SessionStats } from "@bengottschalk/timer-core/stats";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatMultiResult, multiPointsText } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  /** Which averages to show (from settings), in order. */
  specs: AverageSpec[];
  stats: SessionStats;
  /** The solves the stats are worked out from, oldest first (Multi-Blind's best comes from them). */
  solves: Solve[];
  precision: Precision;
  onOpenAverage: (spec: AverageSpec, end: number) => void;
  onOpenSolve: (index: number) => void;
}

/**
 * Wide screens: the current averages, small and muted under the big time
 * (which averages is a setting). Each opens its solves. Multi-Blind has no
 * averages, so it shows its best result instead. Phones show these in
 * ScreenStats instead.
 */
export default function CurrentAverages({ eventId, format, specs, stats, solves, precision, onOpenAverage, onOpenSolve }: Props) {
  if (format === "best") {
    const { bestIndex, successes, attempts } = multiBlindStats(solves);
    if (attempts === 0) return null;
    const best = bestIndex === null ? null : { solve: solves[bestIndex], index: bestIndex };
    return (
      <p className="timer-digits hidden flex-wrap justify-center gap-x-5 text-lg text-muted lg:flex" aria-label="Best result">
        <span><span className="mr-1.5 font-sans text-xs">last</span>{multiPointsText(solves[attempts - 1]) ?? "DNF"}</span>
        <span>
          <span className="mr-1.5 font-sans text-xs">best</span>
          {best ? (
            <button type="button" className="link-hover text-base-content/80" onClick={() => onOpenSolve(best.index)}>
              {formatMultiResult(best.solve, precision)} <span className="text-muted">· {multiPointsText(best.solve)}</span>
            </button>
          ) : "–"}
        </span>
        <span><span className="mr-1.5 font-sans text-xs">successes</span>{successes}/{attempts}</span>
      </p>
    );
  }
  if (specs.length === 0) return null;
  const end = stats.count - 1;
  return (
    <ul className="timer-digits hidden flex-wrap justify-center gap-x-5 gap-y-1 text-lg text-muted lg:flex" aria-label="Current averages">
      {specs.map((spec) => {
        const label = averageLabel(spec);
        const current = stats.averages.find((a) => a.label === label)?.current ?? null;
        const text = formatMean(eventId, current, precision);
        return (
          <li key={label}>
            <span className="mr-1.5 font-sans text-xs">{label}</span>
            {current === null ? text : (
              <button type="button" className="link-hover text-base-content/80" onClick={() => onOpenAverage(spec, end)} aria-label={`Current ${label}: ${text}`}>{text}</button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
