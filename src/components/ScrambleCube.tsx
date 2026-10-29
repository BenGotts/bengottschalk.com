"use client";

import { useCallback, useState, type ReactNode } from "react";
import { PR_SCRAMBLE } from "@/content/prScramble";
import TwistyCube, { type CubeStep } from "./TwistyCube";

/**
 * The self-solving cube with its scramble written out underneath, following
 * along: each move lights up as it's turned, then fades as it's undone.
 * `before` and `after` sit beside the cube in a row (e.g. the 4s of "404").
 */
export default function ScrambleCube({ before, after, rowClassName = "", label = "My 3x3 PR scramble" }: {
  before?: ReactNode;
  after?: ReactNode;
  rowClassName?: string;
  label?: string;
}) {
  const [step, setStep] = useState<CubeStep>({ phase: "solved" });
  const onStep = useCallback((next: CubeStep) => setStep(next), []);
  const moves = PR_SCRAMBLE.split(" ");

  // Moves turned so far stay lit; while solving, the undone ones fade again.
  const lit = (index: number) => {
    if (step.phase === "scrambled") return true;
    if (step.phase === "scrambling") return index <= step.index;
    if (step.phase === "solving") return index < step.index;
    return false;
  };
  const current = step.phase === "scrambling" || step.phase === "solving" ? step.index : -1;

  return (
    <>
      <div aria-hidden="true" className={rowClassName}>
        {before}
        <TwistyCube onStep={onStep} />
        {after}
      </div>
      <figure className="space-y-1.5">
        <figcaption className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</figcaption>
        <p className="flex max-w-md flex-wrap justify-center gap-x-2 gap-y-1 font-mono text-sm" aria-label={PR_SCRAMBLE}>
          {moves.map((move, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`rounded px-0.5 transition-colors ${
                index === current
                  ? step.phase === "solving" ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                  : lit(index) ? "text-base-content" : "text-muted/60"
              }`}
            >
              {move}
            </span>
          ))}
        </p>
      </figure>
    </>
  );
}
