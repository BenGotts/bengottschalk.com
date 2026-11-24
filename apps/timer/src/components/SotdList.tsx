"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { FaStar, FaTrophy } from "react-icons/fa6";
import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { db } from "@/lib/db";
import { formatDay, formatSolve } from "@/lib/format";

/** Every Solve of the Day, newest first, across all events. */
export default function SotdList({ precision, onOpen }: { precision: Precision; onOpen: (solve: Solve) => void }) {
  const rows = useLiveQuery(async () => {
    const marks = (await db.sotd.toArray()).filter((m) => m.deletedAt === null).toSorted((a, b) => b.date.localeCompare(a.date));
    const solves = await db.solves.bulkGet(marks.map((m) => m.solveId));
    return marks.map((mark, i) => ({ mark, solve: solves[i] })).filter((row): row is { mark: typeof row.mark; solve: Solve } => !!row.solve && row.solve.deletedAt === null);
  }, []);

  if (!rows) return null;
  if (rows.length === 0) {
    return <p className="px-1 py-6 text-center text-sm text-muted">No Solve of the Day yet. Open a solve and star it, or press Alt+S right after one.</p>;
  }
  return (
    <ul className="divide-y divide-base-300">
      {rows.map(({ mark, solve }) => (
        <li key={mark.date}>
          <button type="button" className="flex w-full items-center gap-3 px-1 py-2 text-left hover:bg-base-300" onClick={() => onOpen(solve)}>
            <FaStar className="shrink-0 text-accent" aria-hidden />
            <span className="w-28 shrink-0 text-sm text-muted">{formatDay(mark.date)}</span>
            <span className="grow text-sm">
              {timerEvent(solve.eventId).shortName}
              {solve.competition && <span className="text-ink-gold"> · <FaTrophy className="inline align-[-2px]" aria-hidden /> {solve.competition.competitionName}</span>}
            </span>
            <span className="timer-digits">{formatSolve(solve, precision)}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
