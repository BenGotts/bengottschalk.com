"use client";

import { useState } from "react";
import { FaStar } from "react-icons/fa6";
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
}

const PAGE = 100;

export default function SolveList({ eventId, solves, rolling, rollingLabel, sotdSolveIds, branchNames, precision, onOpen }: Props) {
  const [shown, setShown] = useState(PAGE);
  if (solves.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-muted">No solves yet. Hold space (or the timer) and let go to start.</p>;
  }
  const rows = [];
  for (let i = solves.length - 1; i >= 0 && rows.length < shown; i--) rows.push(i);

  return (
    <div>
      <table className="table table-xs">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{{ "fewest-moves": "moves", "multi-blind": "result", time: "time" }[timerEvent(eventId).kind]}</th>
            <th scope="col">{rollingLabel}</th>
            <th scope="col"><span className="sr-only">Notes</span></th>
          </tr>
        </thead>
        <tbody className="timer-digits">
          {rows.map((i) => {
            const solve = solves[i];
            const branch = branchNames.get(solve.sessionId);
            return (
              <tr key={solve.id} className="hover:bg-base-300">
                <td className="text-muted">{i + 1}</td>
                <td>
                  <button type="button" className="link-hover text-left" onClick={() => onOpen(solve)}>
                    {formatSolve(solve, precision)}
                  </button>
                </td>
                <td className="text-muted">{formatMean(eventId, rolling[i], precision)}</td>
                <td className="flex items-center justify-end gap-1.5">
                  {branch && <span className="badge badge-ghost badge-xs font-sans" title={`Done in branch “${branch}”`}>{branch}</span>}
                  {solve.comment && <span className="text-muted" title={solve.comment} aria-label="Has a comment">“</span>}
                  {sotdSolveIds.has(solve.id) && <FaStar className="text-accent" title="Solve of the Day" aria-label="Solve of the Day" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {solves.length > shown && (
        <button type="button" className="btn btn-ghost btn-xs mt-1 w-full" onClick={() => setShown(shown + PAGE)}>
          Show {Math.min(PAGE, solves.length - shown)} more
        </button>
      )}
    </div>
  );
}
