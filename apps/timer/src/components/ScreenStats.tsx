"use client";

import type { EventFormat } from "@bengottschalk/timer-core/events";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { averageBreakdown, type AverageSpec, type SessionStats } from "@bengottschalk/timer-core/stats";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatSolve, formatValue } from "@/lib/format";

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
    <>
      <PhoneStats eventId={eventId} stats={stats} precision={precision} averages={averages} onOpenAverage={onOpenAverage} />
      {/* Wide screens: one row of tiles. */}
      <div className={`hidden gap-1.5 lg:grid ${averages.length > 2 ? "grid-cols-5" : "grid-cols-4"}`} aria-label="Stats">
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
    </>
  );
}

const FIVE: AverageSpec = { kind: "average", size: 5 };

/** Phones: the averages and mean side by side in one panel. No single: it's the time above. */
function PhoneStats({ eventId, stats, precision, averages, onOpenAverage }: Pick<Props, "eventId" | "stats" | "precision" | "onOpenAverage"> & { averages: SessionStats["averages"] }) {
  return (
    <div className="lg:hidden" aria-label="Stats">
      <dl className={`grid divide-x divide-base-300 rounded-box bg-base-200 py-1.5 ${averages.length > 2 ? "grid-cols-4" : "grid-cols-3"}`}>
        {averages.map(({ label, spec, current, best, bestEnd }) => (
          <div key={label} className="min-w-0 px-2">
            <dt className="text-xs text-muted">{label}</dt>
            <dd>
              {value(formatMean(eventId, current, precision), current === null ? null : () => onOpenAverage(spec, stats.count - 1), true)}
              {value(`best ${formatMean(eventId, best, precision)}`, bestEnd === null ? null : () => onOpenAverage(spec, bestEnd), false)}
            </dd>
          </div>
        ))}
        <div className="min-w-0 px-2">
          <dt className="text-xs text-muted">mean</dt>
          <dd>
            {value(formatMean(eventId, stats.mean, precision), null, true)}
            <span className="block truncate text-xs text-muted">{stats.count.toLocaleString()} {stats.count === 1 ? "solve" : "solves"}</span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Phones: the last five solves, oldest first, each in its own column. Once
 * there are five, the dropped best and worst are in brackets, green and red,
 * as in an ao5. A time opens its solve; "last 5" opens the ao5.
 */
export function RecentSolves({ solves, total, precision, onOpenAverage, onOpenSolve }: {
  /** Up to the last five solves, oldest first. */
  solves: Solve[];
  /** How many solves there are in all (to number them). */
  total: number;
  precision: Precision;
  onOpenAverage: (spec: AverageSpec, end: number) => void;
  onOpenSolve: (index: number) => void;
}) {
  // Brackets only once there's a full ao5 to drop from.
  const dropped = solves.length === 5 ? averageBreakdown(solves.map(solveValue), "average").dropped : solves.map(() => null);
  const first = total - solves.length;
  return (
    <div className="flex items-center gap-2 rounded-box bg-base-200 px-2.5 py-1.5" aria-label="Last 5 solves">
      {solves.length === 5 ? (
        <button type="button" className="link-hover shrink-0 text-xs text-muted" onClick={() => onOpenAverage(FIVE, total - 1)}>last 5</button>
      ) : (
        <span className="shrink-0 text-xs text-muted">last 5</span>
      )}
      <ol className="grid min-w-0 flex-1 grid-cols-5 gap-1">
        {solves.length === 0 && <li className="timer-digits text-center text-sm text-muted">–</li>}
        {solves.map((solve, i) => {
          const time = formatSolve(solve, precision);
          const end = dropped[i];
          return (
            <li key={solve.id} className="min-w-0 text-center">
              <button
                type="button"
                className={`timer-digits link-hover max-w-full truncate text-sm ${end === "best" ? "text-success" : end === "worst" ? "text-error" : solve.competition ? "text-ink-gold" : ""}`}
                title={time}
                onClick={() => onOpenSolve(first + i)}
              >
                {end ? `(${time})` : time}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
