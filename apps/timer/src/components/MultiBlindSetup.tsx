"use client";

import { useState } from "react";
import { formatTime } from "@bengottschalk/timer-core/time";
import { multiBlindTimeLimitMs } from "@bengottschalk/timer-core/solve";

/** Multi-Blind: choose how many cubes, then get a scramble for each. */
export default function MultiBlindSetup({ cubes, onCubesChange, scrambles, generating, onGenerate }: {
  cubes: number;
  onCubesChange: (cubes: number) => void;
  scrambles: string[] | null;
  generating: boolean;
  onGenerate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          Cubes
          <input type="number" min={2} max={100} className="input input-sm w-20" value={cubes} onChange={(e) => onCubesChange(Math.max(2, Math.min(100, Number(e.target.value) || 2)))} />
        </label>
        <button type="button" className="btn btn-sm" onClick={onGenerate} disabled={generating}>{generating ? "Making scrambles…" : scrambles ? "New scrambles" : "Make scrambles"}</button>
        <span className="text-muted">Time limit {formatTime(multiBlindTimeLimitMs(cubes)).replace(/\.\d+$/, "")}</span>
        {scrambles && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide" : "Show"} scrambles</button>}
      </div>
      {scrambles && open && (
        <ol className="timer-digits mx-auto max-h-64 max-w-3xl list-decimal space-y-1 overflow-y-auto pl-8 text-left text-sm">
          {scrambles.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      )}
    </div>
  );
}
