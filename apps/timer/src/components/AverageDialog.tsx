"use client";

import { useMemo, useState } from "react";
import { FaRegCopy, FaTrophy } from "react-icons/fa6";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { averageBreakdown, averageLabel, type AverageSpec } from "@bengottschalk/timer-core/stats";
import type { Precision } from "@bengottschalk/timer-core/time";
import { averageClipboardText } from "@/lib/averageText";
import { formatDateTime, formatMean, formatSolve } from "@/lib/format";
import Modal from "./Modal";

/** An average to show: its kind and size, and which solves it covers. */
export interface AverageView {
  spec: AverageSpec;
  /** Index (in the solves shown) of the average's last solve. */
  end: number;
}

interface Props {
  view: AverageView | null;
  onClose: () => void;
  eventId: string;
  /** The solves the stats are worked out from, oldest first. */
  solves: Solve[];
  precision: Precision;
  onOpenSolve: (solve: Solve) => void;
}

/**
 * The solves in one average, like csTimer's: each time (dropped ones in
 * parentheses), when it was done, its scramble and comment, and a Copy
 * button for the whole list.
 */
export default function AverageDialog({ view, onClose, eventId, solves, precision, onOpenSolve }: Props) {
  const label = view ? averageLabel(view.spec) : "";
  const start = view ? view.end - view.spec.size + 1 : 0;
  const averaged = useMemo(() => (view && start >= 0 ? solves.slice(start, view.end + 1) : []), [view, start, solves]);
  const { value, trimmed } = useMemo(() => averageBreakdown(averaged.map(solveValue), view?.spec.kind ?? "average"), [averaged, view]);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(averageClipboardText({ label, eventId, value, solves: averaged, trimmed, precision, generatedAt: Date.now() }));
      setCopied("Copied");
    } catch {
      setCopied("Couldn't copy");
    }
    setTimeout(() => setCopied(null), 1500);
  };

  const complete = view !== null && averaged.length === view.spec.size;
  return (
    <Modal open={view !== null} onClose={onClose} title={complete ? `${label}: ${formatMean(eventId, value, precision)}` : label} wide>
      {complete ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              Solves {start + 1}–{view.end + 1}
              {view.spec.kind === "average" && " · times in parentheses don't count"}
            </p>
            <div className="flex items-center gap-2">
              <output className="text-sm text-success">{copied}</output>
              <button type="button" className="btn btn-sm" onClick={() => void copy()}><FaRegCopy aria-hidden /> Copy</button>
            </div>
          </div>
          <ol className="divide-y divide-base-300 rounded-box border border-base-300">
            {averaged.map((solve, i) => {
              const time = formatSolve(solve, precision);
              return (
                <li key={solve.id}>
                  <button
                    type="button"
                    className={`grid w-full grid-cols-[2.5rem_5.5rem_1fr] gap-x-3 gap-y-1 px-3 py-2 text-left hover:bg-base-200 ${solve.competition ? "bg-ink-gold/8" : ""}`}
                    onClick={() => onOpenSolve(solve)}
                  >
                    <span className="timer-digits text-sm text-muted">{start + i + 1}.</span>
                    <span className={`timer-digits ${trimmed[i] ? "text-muted" : "font-medium"} ${solve.competition ? "text-ink-gold" : ""}`}>
                      {trimmed[i] ? `(${time})` : time}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDateTime(solve.startedAt)}
                      {solve.competition && (
                        <span className="ml-2 inline-flex items-center gap-1 text-ink-gold">
                          <FaTrophy aria-label="Competition attempt" /> {solve.competition.competitionName}
                        </span>
                      )}
                    </span>
                    <span className="timer-digits col-start-2 col-end-4 text-sm break-words whitespace-pre-wrap">
                      {solve.scramble || <span className="font-sans text-muted">Scramble not known</span>}
                    </span>
                    {solve.comment && <span className="col-start-2 col-end-4 text-sm text-muted">“{solve.comment}”</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="text-sm text-muted">Not enough solves yet for this average.</p>
      )}
    </Modal>
  );
}
