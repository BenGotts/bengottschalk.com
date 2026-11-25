"use client";

import { useMemo, useState } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { multiBlindStats } from "@bengottschalk/timer-core/multi";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import type { AverageSpec } from "@bengottschalk/timer-core/stats";
import { sessionSummary, type PlacedAverage } from "@bengottschalk/timer-core/summary";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatMultiResult, formatSolveWithPoints, formatValue, multiPointsText } from "@/lib/format";
import { sessionClipboardText } from "@/lib/sessionText";
import AverageDialog, { type AverageView } from "./AverageDialog";
import Modal from "./Modal";

const LIST_LIMIT = 1000;

interface Props {
  name: string;
  eventId: string;
  /** The session's solves, oldest first. */
  solves: Solve[];
  precision: Precision;
  onOpenSolve: (solve: Solve) => void;
}

/**
 * A session at a glance: counts, mean and spread, best and worst singles and
 * averages (each opens to show its solves), the whole session as one
 * average, how the times spread out, and every solve with its scramble.
 */
export function SessionSummary({ name, eventId, solves, precision, onOpenSolve }: Props) {
  const event = timerEvent(eventId);
  const summary = useMemo(
    () => sessionSummary(solves.map(solveValue), { fullKind: event.format === "mo3" ? "mean" : "average", minStep: event.kind === "fewest-moves" ? 1 : 10 }),
    [solves, event.format, event.kind],
  );
  const [average, setAverage] = useState<AverageView | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const mean = (value: number | null) => formatMean(eventId, value, precision);
  const single = (value: number | null) => formatValue(eventId, value, precision);

  if (solves.length === 0) return <p className="text-sm text-muted">No solves in this session yet.</p>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sessionClipboardText({ name, eventId, summary, solves, precision, generatedAt: Date.now() }));
      setCopied("Copied");
    } catch {
      setCopied("Couldn't copy");
    }
    setTimeout(() => setCopied(null), 1500);
  };

  const open = (spec: AverageSpec, placed: PlacedAverage | null) => placed && setAverage({ spec, end: placed.end });
  const openSingle = (placed: PlacedAverage | null) => placed && onOpenSolve(solves[placed.end]);
  const tallest = Math.max(1, ...summary.histogram.map((b) => b.count));
  // Multi-Blind has no averages or spread of times: its results by points instead.
  const multi = event.kind === "multi-blind" ? multiBlindStats(solves) : null;
  const multiBest = multi?.bestIndex === null || multi === null ? null : solves[multi.bestIndex];

  return (
    <div className="space-y-4">
      {multi ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Tile label="Attempts" value={multi.attempts.toLocaleString()} detail={multi.attempts === multi.successes ? "no DNFs" : `${multi.attempts - multi.successes} DNF`} />
          <Tile
            label="Best"
            value={multiBest ? formatMultiResult(multiBest, precision) : "–"}
            detail={multiBest && multi.bestIndex !== null ? `${multiPointsText(multiBest)} · attempt ${multi.bestIndex + 1}` : undefined}
            onClick={multiBest ? () => onOpenSolve(multiBest) : undefined}
          />
          <Tile label="Mean points" value={multi.meanPoints === null ? "–" : multi.meanPoints.toFixed(2)} detail="of the attempts that count" />
          <Tile label="Cubes" value={`${multi.cubesSolved}/${multi.cubesAttempted}`} detail="solved" />
        </div>
      ) : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile label="Solves" value={summary.count.toLocaleString()} detail={summary.dnfs ? `${summary.dnfs} DNF` : "no DNFs"} />
        {summary.full && (
          <Tile
            label={summary.full.label}
            value={mean(summary.full.value)}
            detail="the whole session"
            onClick={() => setAverage({ spec: summary.full!.spec, end: solves.length - 1 })}
          />
        )}
        <Tile label="Mean" value={mean(summary.mean)} detail={summary.sd === null ? undefined : `σ ${mean(summary.sd)}`} />
        <Tile label="Best" value={single(summary.best?.value ?? null)} detail={summary.best ? `solve ${summary.best.end + 1}` : undefined} onClick={summary.best ? () => openSingle(summary.best) : undefined} />
        <Tile label="Worst" value={single(summary.worst?.value ?? null)} detail={summary.worst ? `solve ${summary.worst.end + 1}` : undefined} onClick={summary.worst ? () => openSingle(summary.worst) : undefined} />
      </div>}

      {!multi && summary.averages.length > 0 && (
        <table className="table table-sm">
          <thead>
            <tr><th scope="col"><span className="sr-only">Average</span></th><th scope="col">best</th><th scope="col">worst</th></tr>
          </thead>
          <tbody className="timer-digits">
            {summary.averages.map((a) => (
              <tr key={a.label}>
                <th scope="row" className="font-normal text-muted">{a.label}</th>
                <td><button type="button" className="link-hover" onClick={() => open(a.spec, a.best)}>{mean(a.best?.value ?? null)}</button></td>
                <td><button type="button" className="link-hover" onClick={() => open(a.spec, a.worst)}>{mean(a.worst?.value ?? null)}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!multi && summary.histogram.length > 1 && (
        <figure>
          <figcaption className="mb-2 text-sm font-medium">How the times spread out</figcaption>
          <ul className="space-y-1">
            {summary.histogram.map((bucket) => (
              <li key={bucket.from} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-xs">
                <span className="timer-digits text-right text-muted">{single(bucket.from)}+</span>
                <span className="h-3 rounded-sm bg-base-300">
                  <span className="block h-full rounded-sm bg-primary" style={{ width: `${(bucket.count / tallest) * 100}%` }} />
                </span>
                <span className="timer-digits text-muted">{bucket.count}</span>
              </li>
            ))}
          </ul>
        </figure>
      )}

      <details className="rounded-box border border-base-300" onToggle={(e) => setListOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">All {solves.length.toLocaleString()} solves, with scrambles</summary>
        {/* Drawn only when opened, and at most the latest LIST_LIMIT (Main can hold many thousands). */}
        {listOpen && solves.length > LIST_LIMIT && (
          <p className="border-t border-base-300 px-3 py-1.5 text-xs text-muted">Showing the latest {LIST_LIMIT.toLocaleString()}; Copy summary has them all.</p>
        )}
        {listOpen && <ol className="max-h-80 divide-y divide-base-300 overflow-y-auto border-t border-base-300">
          {solves.slice(-LIST_LIMIT).map((solve, j) => {
            const i = Math.max(0, solves.length - LIST_LIMIT) + j;
            return (
            <li key={solve.id}>
              <button type="button" className="grid w-full grid-cols-[2.5rem_5.5rem_1fr] gap-x-3 px-3 py-1.5 text-left hover:bg-base-200" onClick={() => onOpenSolve(solve)}>
                <span className="timer-digits text-sm text-muted">{i + 1}.</span>
                <span className="timer-digits text-sm">{formatSolveWithPoints(solve, precision)}</span>
                <span className="scramble-text truncate text-xs text-muted">{solve.scramble || "–"}</span>
              </button>
            </li>
            );
          })}
        </ol>}
      </details>

      <div className="flex items-center justify-end gap-2">
        <output className="text-sm text-success">{copied}</output>
        <button type="button" className="btn btn-sm" onClick={() => void copy()}><FaRegCopy aria-hidden /> Copy summary</button>
      </div>

      <AverageDialog view={average} onClose={() => setAverage(null)} eventId={eventId} solves={solves} precision={precision} onOpenSolve={onOpenSolve} />
    </div>
  );
}

function Tile({ label, value, detail, onClick }: { label: string; value: string; detail?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="block text-xs text-muted">{label}</span>
      <span className="timer-digits block text-lg">{value}</span>
      {detail && <span className="block text-xs text-muted">{detail}</span>}
    </>
  );
  return onClick ? (
    <button type="button" className="rounded-box bg-base-200 p-2 text-left hover:bg-base-300" onClick={onClick}>{body}</button>
  ) : (
    <div className="rounded-box bg-base-200 p-2">{body}</div>
  );
}

/** A session's summary in its own dialog (from the sessions list or a read-only session). */
export function SessionSummaryDialog({ open, onClose, ...props }: Props & { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title={`${props.name}: summary`} wide>
      <SessionSummary {...props} />
    </Modal>
  );
}
