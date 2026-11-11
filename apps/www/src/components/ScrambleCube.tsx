"use client";

import { useCallback, useState, type ReactNode } from "react";
import { PR_SOLVE, type Solve } from "@bengottschalk/cube/solves";
import { useRandomSolve } from "@bengottschalk/cube/useRandomSolve";
import TwistyCube, { type CubeStep } from "@bengottschalk/cube/TwistyCube";

/** The solution's steps, each move numbered in the order the cube plays them. */
function solutionSteps(solve: Solve) {
  return solve.solution.reduce<{ label: string; moves: { move: string; index: number }[] }[]>((steps, step) => {
    const start = steps.reduce((count, s) => count + s.moves.length, 0);
    return [...steps, { label: step.label, moves: step.moves.split(" ").map((move, i) => ({ move, index: start + i })) }];
  }, []);
}

function Move({ move, state }: { move: string; state: "current" | "done" | "todo" }) {
  return (
    <span
      className={`rounded px-0.5 transition-colors ${
        state === "current" ? "bg-primary/20 text-primary" : state === "done" ? "text-base-content" : "text-muted/60"
      }`}
    >
      {move}
    </span>
  );
}

/**
 * The self-solving cube with one of my solves, picked at random (my official
 * PR or my at-home PB): its scramble written out above the cube and my
 * solution below, following along move by move. `before` and `after` sit beside
 * the cube in a row (e.g. the 4s of "404").
 */
export default function ScrambleCube({ before, after, rowClassName = "" }: {
  before?: ReactNode;
  after?: ReactNode;
  rowClassName?: string;
}) {
  const picked = useRandomSolve();
  // Until the pick, the PR's moves hold the space, hidden, so the page doesn't jump much.
  const solve = picked ?? PR_SOLVE;
  const [step, setStep] = useState<CubeStep>({ phase: "solved" });
  const onStep = useCallback((next: CubeStep) => setStep(next), []);

  const scrambleState = (index: number) => {
    if (step.phase === "scrambling") return index === step.index ? "current" : index < step.index ? "done" : "todo";
    return step.phase === "solved" ? "todo" : "done";
  };
  const solutionState = (index: number) => {
    if (step.phase === "solving") return index === step.index ? "current" : index < step.index ? "done" : "todo";
    return step.phase === "solved" ? "done" : "todo";
  };

  return (
    <>
      <div className={`w-full max-w-lg space-y-1 font-mono text-sm ${picked ? "" : "invisible"}`}>
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">My {solve.title} scramble</p>
        <p className="flex flex-wrap justify-center gap-x-2 gap-y-1" aria-label={`My ${solve.title} scramble: ${solve.scramble}`}>
          {solve.scramble.split(" ").map((move, index) => (
            <span key={index} aria-hidden="true"><Move move={move} state={scrambleState(index)} /></span>
          ))}
        </p>
      </div>
      <div aria-hidden="true" className={rowClassName}>
        {before}
        <TwistyCube solve={picked} onStep={onStep} />
        {after}
      </div>
      <div className={`w-full max-w-lg space-y-1 font-mono text-sm ${picked ? "" : "invisible"}`}>
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">My solution</p>
        <ol className="space-y-1">
          {solutionSteps(solve).map((solutionStep) => (
            <li key={solutionStep.label} className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
              <span className="sr-only">{`${solutionStep.label}: ${solutionStep.moves.map((m) => m.move).join(" ")}`}</span>
              <span aria-hidden="true" className="contents">
                {solutionStep.moves.map(({ move, index }) => <Move key={index} move={move} state={solutionState(index)} />)}
                <span className="font-sans text-xs text-muted">{`// ${solutionStep.label}`}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
