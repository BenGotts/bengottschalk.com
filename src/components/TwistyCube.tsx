"use client";

import { useEffect, useState } from "react";
import { PR_SCRAMBLE, PR_SOLUTION } from "@/content/prScramble";
import { applyTurn, CUBIES, IDENTITY, inLayer, reorientation, type Matrix } from "@/lib/cube/model";
import { parseScramble, type Turn } from "@/lib/cube/notation";

// A 3×3 cube that plays a scramble, then a solution (by default my PR's), and
// loops. Cubies are positioned with CSS 3D transforms; each turn is a CSS
// transition on the turning layer, baked into the cubies' rotations after.

/** Where the cube is: turning move `index` of the scramble or solution, or resting. */
export type CubeStep =
  | { phase: "scrambling" | "solving"; index: number }
  | { phase: "scrambled" | "solved" };

const TURN_MS = 320;
const HALF_TURN_MS = 450;
const PAUSE_MS = 90;

// Sticker colors, matching StickerLogo and src/app/icon.svg.
const COLORS = { right: "#C41E3A", left: "#FF5800", top: "#F4F4F4", bottom: "#FFD500", front: "#009E60", back: "#0051BA" };
const FACES = [
  { name: "right", transform: "rotateY(90deg)", axis: 0, side: 1 },
  { name: "left", transform: "rotateY(-90deg)", axis: 0, side: -1 },
  { name: "top", transform: "rotateX(90deg)", axis: 1, side: -1 },
  { name: "bottom", transform: "rotateX(-90deg)", axis: 1, side: 1 },
  { name: "front", transform: "", axis: 2, side: 1 },
  { name: "back", transform: "rotateY(180deg)", axis: 2, side: -1 },
] as const;

const AXIS_VECTORS = ["1,0,0", "0,1,0", "0,0,1"];
// matrix3d() is column-major.
const matrix3d = (m: Matrix) => `matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)`;
const DEFAULT_SOLUTION = PR_SOLUTION.map((step) => step.moves).join(" ");

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function TwistyCube({ className, scramble = PR_SCRAMBLE, solution = DEFAULT_SOLUTION, onStep }: {
  className?: string;
  /** In WCA notation, e.g. "R U' F2". */
  scramble?: string;
  /** Moves (rotations allowed) that solve the scramble. */
  solution?: string;
  /** Called as each move starts and when the cube rests scrambled or solved. */
  onStep?: (step: CubeStep) => void;
}) {
  const [rotations, setRotations] = useState<Matrix[]>(() => CUBIES.map(() => IDENTITY));
  const [move, setMove] = useState<Turn | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controller = new AbortController();
    const { signal } = controller;
    const scrambleTurns = parseScramble(scramble);
    const solutionTurns = parseScramble(solution);
    // The cube's state, mirrored outside React so the loop can plan from it.
    let current = CUBIES.map(() => IDENTITY);

    async function play(turns: Turn[], phase?: "scrambling" | "solving") {
      for (const [index, next] of turns.entries()) {
        if (signal.aborted) return;
        if (phase) onStep?.({ phase, index });
        setMove(next);
        await wait(next.amount === 2 ? HALF_TURN_MS : TURN_MS);
        if (signal.aborted) return;
        current = applyTurn(current, next);
        setRotations(current);
        setMove(null);
        await wait(PAUSE_MS);
      }
    }

    (async () => {
      await wait(800);
      while (!signal.aborted) {
        await play(scrambleTurns, "scrambling");
        if (signal.aborted) return;
        onStep?.({ phase: "scrambled" });
        await wait(1500);
        await play(solutionTurns, "solving");
        if (signal.aborted) return;
        onStep?.({ phase: "solved" });
        await wait(1200);
        // A solve can end with the cube held differently; turn it back to start again.
        await play(reorientation(current));
        await wait(1600);
      }
    })();
    return () => controller.abort();
  }, [scramble, solution, onStep]);

  return (
    <div className={`twisty-cube ${className ?? ""}`}>
      <div className="twisty-cube-body">
        {CUBIES.map((home, i) => {
          const rotation = rotations[i];
          const turning = move !== null && inLayer(move, rotation, home);
          const angle = turning ? move.dir * 90 * move.amount : 0;
          return (
            <div
              key={home.join()}
              className="twisty-cubie"
              style={{
                transform: `rotate3d(${AXIS_VECTORS[move?.axis ?? 0]},${angle}deg) ${matrix3d(rotation)} translate3d(calc(${home[0]} * var(--cubie)), calc(${home[1]} * var(--cubie)), calc(${home[2]} * var(--cubie)))`,
                transition: turning ? `transform ${move.amount === 2 ? HALF_TURN_MS : TURN_MS}ms ease-in-out` : "none",
              }}
            >
              {FACES.map((face) => (
                <div
                  key={face.name}
                  className="twisty-face"
                  style={{
                    transform: `${face.transform} translateZ(calc(var(--cubie) / 2))`,
                    "--sticker": home[face.axis] === face.side ? COLORS[face.name] : undefined,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
