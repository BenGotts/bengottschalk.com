"use client";

import { useEffect, useRef, useState } from "react";
import { FaStar, FaTrophy } from "react-icons/fa6";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { formatMean, formatSolve } from "@/lib/format";

interface Props {
  eventId: string;
  solves: Solve[];
  /** Rolling ao5 (or mo3) for each solve, same order as `solves`. */
  rolling: (number | null)[];
  rollingLabel: string;
  sotdSolveIds: Set<string>;
  /** Solves done in a branch, when showing a main session. */
  branchNames: Map<string, string>;
  precision: Precision;
  onOpen: (solve: Solve) => void;
  /** Opens the solves in the rolling average ending at index `end`. */
  onOpenAverage: (end: number) => void;
}

/** Every row is this tall, so only the rows on screen need drawing. */
const ROW_HEIGHT = 28;
/** Extra rows drawn above and below the visible ones, so fast scrolling doesn't show gaps. */
const OVERSCAN = 20;

export default function SolveList({ eventId, solves, rolling, rollingLabel, sotdSolveIds, branchNames, precision, onOpen, onOpenAverage }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ top: 0, height: 800 });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return undefined;
    const measure = () => setView({ top: element.scrollTop, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  // Newest first: row r shows solve solves.length - 1 - r.
  const first = Math.max(0, Math.floor(view.top / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(solves.length, Math.ceil((view.top + view.height) / ROW_HEIGHT) + OVERSCAN);
  const rows = [];
  for (let r = first; r < last; r++) rows.push(solves.length - 1 - r);

  return (
    <div ref={scroller} className="h-full overflow-y-auto">
      {solves.length === 0 && <p className="px-1 py-6 text-center text-sm text-muted">No solves yet. Hold space (or the timer) and let go to start.</p>}
      <table hidden={solves.length === 0} className="table table-xs table-pin-rows w-full">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{{ "fewest-moves": "moves", "multi-blind": "result", time: "time" }[timerEvent(eventId).kind]}</th>
            <th scope="col">{rollingLabel}</th>
            <th scope="col"><span className="sr-only">Notes</span></th>
          </tr>
        </thead>
        <tbody className="timer-digits">
          {first > 0 && <tr aria-hidden style={{ height: first * ROW_HEIGHT }} />}
          {rows.map((i) => {
            const solve = solves[i];
            const branch = branchNames.get(solve.sessionId);
            return (
              <tr key={solve.id} style={{ height: ROW_HEIGHT }} className={solve.competition ? "bg-ink-gold/8 hover:bg-ink-gold/15" : "hover:bg-base-300"}>
                <td className="text-muted">{i + 1}</td>
                <td>
                  <button type="button" className={`link-hover text-left ${solve.competition ? "text-ink-gold" : ""}`} onClick={() => onOpen(solve)}>
                    {formatSolve(solve, precision)}
                  </button>
                </td>
                <td className="text-muted">
                  {rolling[i] === null ? formatMean(eventId, null, precision) : (
                    <button type="button" className="link-hover" onClick={() => onOpenAverage(i)} aria-label={`${rollingLabel} ending at solve ${i + 1}`}>
                      {formatMean(eventId, rolling[i], precision)}
                    </button>
                  )}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                  {solve.competition && (
                    <FaTrophy
                      className="text-ink-gold"
                      title={`${solve.competition.competitionName}${solve.competition.status === "live" ? " (live)" : ""}`}
                      aria-label={`Competition attempt: ${solve.competition.competitionName}`}
                    />
                  )}
                  {branch && <span className="badge badge-ghost badge-xs font-sans" title={`Done in branch “${branch}”`}>{branch}</span>}
                  {solve.comment && <span className="text-muted" title={solve.comment} aria-label="Has a comment">“</span>}
                  {sotdSolveIds.has(solve.id) && <FaStar className="text-accent" title="Solve of the Day" aria-label="Solve of the Day" />}
                  </div>
                </td>
              </tr>
            );
          })}
          {last < solves.length && <tr aria-hidden style={{ height: (solves.length - last) * ROW_HEIGHT }} />}
        </tbody>
      </table>
    </div>
  );
}
