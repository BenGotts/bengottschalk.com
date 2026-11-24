"use client";

import { useState } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { formatTime } from "@bengottschalk/timer-core/time";
import { multiBlindTimeLimitMs } from "@bengottschalk/timer-core/solve";
import type { ColorScheme } from "@/lib/colorSchemes";
import Modal from "./Modal";
import NumberField from "./NumberField";
import ScrambleImage from "./ScrambleImage";

/** Most cubes a Multi-Blind attempt can have here. The WCA has no cap, but the hour limit makes more than this unrealistic. */
export const MAX_MULTI_CUBES = 200;

/** Multi-Blind: type how many cubes, make a scramble for each, and see them all (with pictures) in a dialog. */
export default function MultiBlindSetup({ cubes, onCubesChange, scrambles, generating, onGenerate, scheme }: {
  cubes: number;
  onCubesChange: (cubes: number) => void;
  scrambles: string[] | null;
  generating: boolean;
  onGenerate: () => void;
  scheme: ColorScheme;
}) {
  const [open, setOpen] = useState(false);
  const [valid, setValid] = useState(true);
  const [copied, setCopied] = useState(false);
  // New scrambles open the list straight away.
  const [shown, setShown] = useState(scrambles);
  if (scrambles !== shown) {
    setShown(scrambles);
    if (scrambles) setOpen(true);
  }

  const copyAll = async () => {
    if (!scrambles) return;
    try {
      await navigator.clipboard.writeText(scrambles.map((s, i) => `${i + 1}. ${s}`).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Copying is a convenience; the scrambles are on screen.
    }
  };

  return (
    <div className="w-full">
      <form
        className="flex flex-wrap items-center justify-center gap-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !generating) onGenerate();
        }}
      >
        <label htmlFor="mbld-cubes" className="flex items-center gap-2">
          Cubes
          <NumberField id="mbld-cubes" className="input-sm w-20" value={cubes} min={2} max={MAX_MULTI_CUBES} onChange={onCubesChange} onValidity={setValid} />
        </label>
        <button type="submit" className="btn btn-sm" disabled={generating || !valid}>
          {generating ? "Making scrambles…" : scrambles ? "New scrambles" : "Make scrambles"}
        </button>
        {valid ? (
          <span className="text-muted">Time limit {formatTime(multiBlindTimeLimitMs(cubes)).replace(/\.\d+$/, "")}</span>
        ) : (
          <span className="text-error">2 to {MAX_MULTI_CUBES} cubes</span>
        )}
        {scrambles && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>
            Show {scrambles.length} scrambles
          </button>
        )}
      </form>

      <Modal open={open && scrambles !== null} onClose={() => setOpen(false)} title={`Multi-Blind: ${scrambles?.length ?? 0} scrambles`} wide>
        {scrambles && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-sm" onClick={() => void copyAll()}>
                <FaRegCopy aria-hidden /> Copy all
              </button>
              <output className="text-sm text-success">{copied ? "Copied" : null}</output>
            </div>
            <ol className="divide-y divide-base-content/10 text-left">
              {scrambles.map((s, i) => (
                // The list is made once per attempt and never reordered, so the index is a stable key.
                // oxlint-disable-next-line react/no-array-index-key
                <li key={i} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <span className="timer-digits w-8 shrink-0 text-lg font-semibold text-muted">{i + 1}</span>
                  <p className="scramble-text min-w-0 flex-1 text-sm leading-6">{s}</p>
                  <div className="h-28 w-40 shrink-0 self-center">
                    <ScrambleImage puzzleId="3x3x3" scramble={s} scheme={scheme} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}
