"use client";

import { useEffect, useState } from "react";
import { countFmcMoves } from "@bengottschalk/timer-core/solve";
import { formatRunning } from "@bengottschalk/timer-core/time";
import { solvesScramble } from "@/lib/scrambles";

const HOUR = 3_600_000;

export interface FmcResult {
  solution: string;
  moves: number;
  dnf: boolean;
  startedAt: number;
  timeMs: number;
}

/** Fewest Moves: an hour's countdown, then the solution, checked against the scramble. */
export default function FmcPanel({ scramble, onSave, disabled }: { scramble: string | null; onSave: (result: FmcResult) => void; disabled: boolean }) {
  const [solution, setSolution] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startedAt === null) return undefined;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt]);

  const moves = countFmcMoves(solution);
  const remaining = startedAt === null ? HOUR : Math.max(0, HOUR - (now - startedAt));

  const reset = () => {
    setSolution("");
    setStartedAt(null);
    setMessage(null);
  };

  const submit = async (dnf: boolean) => {
    if (!scramble) return;
    if (!dnf) {
      if (moves === null || moves === 0) return setMessage("Write a solution in outer block turns (R, U2, Fw', x…).");
      if (moves > 80) return setMessage("WCA solutions can be at most 80 moves.");
      if (!(await solvesScramble(scramble, solution))) {
        if (!confirm("That solution doesn't solve the scramble. Save it as a DNF?")) return;
        dnf = true;
      }
    }
    const start = startedAt ?? Date.now();
    onSave({ solution: solution.trim(), moves: moves ?? 0, dnf, startedAt: start, timeMs: startedAt === null ? 0 : Math.min(HOUR, Date.now() - startedAt) });
    reset();
  };

  return (
    <div className="mx-auto w-full max-w-xl space-y-3">
      <div className="flex items-center justify-between">
        <span className={`timer-digits text-5xl ${remaining === 0 ? "text-error" : ""}`}>{formatRunning(remaining).replace(/\.\d+$/, "")}</span>
        {startedAt === null
          ? <button type="button" className="btn btn-sm" onClick={() => { setStartedAt(Date.now()); setNow(Date.now()); }} disabled={disabled}>Start the hour</button>
          : <button type="button" className="btn btn-sm btn-ghost" onClick={() => setStartedAt(null)}>Stop</button>}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm text-muted">Solution {moves !== null && moves > 0 && <span className="text-base-content">· {moves} moves</span>}{moves === null && <span className="text-error"> · has a move that isn't allowed</span>}</span>
        <textarea className="textarea timer-digits w-full" rows={4} value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="R U' F2 …  (// for comments)" disabled={disabled} />
      </label>
      {message && <p className="text-sm text-error" role="alert">{message}</p>}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={() => void submit(false)} disabled={disabled || !scramble}>Save</button>
        <button type="button" className="btn btn-sm" onClick={() => void submit(true)} disabled={disabled || !scramble}>Save as DNF</button>
      </div>
    </div>
  );
}
