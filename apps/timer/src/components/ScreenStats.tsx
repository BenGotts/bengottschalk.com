"use client";

import type { EventFormat } from "@bengottschalk/timer-core/events";
import type { AverageSpec, SessionStats } from "@bengottschalk/timer-core/stats";
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

/** Which averages lead for each event format, in order. */
const LEAD: Record<EventFormat, string[]> = {
  ao5: ["ao5", "ao12", "ao100"],
  mo3: ["mo3", "ao5", "ao12"],
  best: ["mo3", "ao5", "ao12"],
};

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-box bg-base-200 px-2 py-1.5 sm:px-2.5">
      <div className="text-xs text-muted">{label}</div>
      {children}
    </div>
  );
}

/** A stat: big for the current value, small and muted for the best; a button when it opens something. */
function value(text: string, onClick: (() => void) | null, big: boolean) {
  const className = `timer-digits truncate ${big ? "text-base leading-tight sm:text-lg" : "text-xs text-muted"}`;
  return onClick ? (
    <button type="button" className={`${className} link-hover block text-left`} onClick={onClick}>{text}</button>
  ) : (
    <span className={`${className} block`}>{text}</span>
  );
}

/**
 * The key numbers on the timer screen itself: the leading averages (current
 * and best, each opens its solves), the single (current and best), and the
 * mean with the solve count. ao100 shows once there are 100 solves.
 */
export default function ScreenStats({ eventId, format, stats, precision, onOpenAverage, onOpenSolve }: Props) {
  const averages = LEAD[format].flatMap((label) => {
    const average = stats.averages.find((a) => a.label === label);
    return average && (average.spec.size < 100 || stats.count >= average.spec.size) ? [average] : [];
  });

  const { bestIndex } = stats;
  const dnfs = stats.count - stats.solved;
  const countText = `${stats.count.toLocaleString()} ${stats.count === 1 ? "solve" : "solves"}${dnfs > 0 ? ` · ${dnfs.toLocaleString()} DNF` : ""}`;
  return (
    // Two rows on phones (beside the scramble picture), one row on wider screens.
    <div className={`grid gap-1.5 ${averages.length > 2 ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-2 sm:grid-cols-4"}`} aria-label="Stats">
      {averages.map(({ label, spec, current, best, bestEnd }) => (
        <Tile key={label} label={label}>
          {value(formatMean(eventId, current, precision), current === null ? null : () => onOpenAverage(spec, stats.count - 1), true)}
          {value(`best ${formatMean(eventId, best, precision)}`, bestEnd === null ? null : () => onOpenAverage(spec, bestEnd), false)}
        </Tile>
      ))}
      <Tile label="single">
        {value(formatValue(eventId, stats.last, precision), stats.count === 0 ? null : () => onOpenSolve(stats.count - 1), true)}
        {value(`best ${formatValue(eventId, stats.best, precision)}`, bestIndex === null ? null : () => onOpenSolve(bestIndex), false)}
      </Tile>
      <Tile label="mean">
        {value(formatMean(eventId, stats.mean, precision), null, true)}
        <span className="block truncate text-xs text-muted" title={countText}>{countText}</span>
      </Tile>
    </div>
  );
}
