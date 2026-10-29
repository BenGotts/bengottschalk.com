"use client";

import { useEffect, useState } from "react";

// A 3×3 cube that scrambles itself, then solves by undoing the scramble.
// Cubies are positioned with CSS 3D transforms; each turn is a CSS
// transition on the turning layer, baked into the cubies' rotations after.

type Axis = 0 | 1 | 2; // x, y, z (CSS axes: y points down, z toward the viewer)
type Matrix = number[][];
interface Move { axis: Axis; layer: -1 | 0 | 1; dir: 1 | -1 }

const TURN_MS = 320;
const PAUSE_MS = 90;
const SCRAMBLE_LENGTH = 10;

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

const CUBIES = [-1, 0, 1].flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => [x, y, z])))
  .filter(([x, y, z]) => x !== 0 || y !== 0 || z !== 0);
const IDENTITY: Matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const AXIS_VECTORS = ["1,0,0", "0,1,0", "0,0,1"];

/** A quarter turn about an axis, matching CSS rotateX/Y/Z(dir × 90deg). */
function quarterTurn(axis: Axis, dir: 1 | -1): Matrix {
  if (axis === 0) return [[1, 0, 0], [0, 0, -dir], [0, dir, 0]];
  if (axis === 1) return [[0, 0, dir], [0, 1, 0], [-dir, 0, 0]];
  return [[0, -dir, 0], [dir, 0, 0], [0, 0, 1]];
}

const multiply = (a: Matrix, b: Matrix): Matrix => a.map((row) => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)));
const apply = (m: Matrix, v: number[]) => m.map((row) => row.reduce((sum, value, k) => sum + value * v[k], 0));
// matrix3d() is column-major.
const matrix3d = (m: Matrix) => `matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)`;

function scramble(length: number): Move[] {
  const moves: Move[] = [];
  while (moves.length < length) {
    const axis = Math.floor(Math.random() * 3) as Axis;
    // Never turn the same axis twice in a row, so every move reads as a new twist.
    if (moves.at(-1)?.axis === axis) continue;
    moves.push({ axis, layer: Math.random() < 0.5 ? -1 : 1, dir: Math.random() < 0.5 ? -1 : 1 });
  }
  return moves;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function TwistyCube({ className }: { className?: string }) {
  const [rotations, setRotations] = useState<Matrix[]>(() => CUBIES.map(() => IDENTITY));
  const [move, setMove] = useState<Move | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controller = new AbortController();
    const { signal } = controller;

    async function play(moves: Move[]) {
      for (const next of moves) {
        if (signal.aborted) return;
        setMove(next);
        await wait(TURN_MS);
        if (signal.aborted) return;
        const turn = quarterTurn(next.axis, next.dir);
        setRotations((current) => current.map((rotation, i) =>
          apply(rotation, CUBIES[i])[next.axis] === next.layer ? multiply(turn, rotation) : rotation));
        setMove(null);
        await wait(PAUSE_MS);
      }
    }

    (async () => {
      await wait(800);
      while (!signal.aborted) {
        const moves = scramble(SCRAMBLE_LENGTH);
        await play(moves);
        await wait(1200);
        await play(moves.toReversed().map((m) => ({ ...m, dir: m.dir === 1 ? -1 : 1 }) as Move));
        await wait(2400);
      }
    })();
    return () => controller.abort();
  }, []);

  return (
    <div className={`twisty-cube ${className ?? ""}`}>
      <div className="twisty-cube-body">
        {CUBIES.map((home, i) => {
          const rotation = rotations[i];
          const turning = move !== null && apply(rotation, home)[move.axis] === move.layer;
          const angle = turning ? move.dir * 90 : 0;
          return (
            <div
              key={home.join()}
              className="twisty-cubie"
              style={{
                transform: `rotate3d(${AXIS_VECTORS[move?.axis ?? 0]},${angle}deg) ${matrix3d(rotation)} translate3d(calc(${home[0]} * var(--cubie)), calc(${home[1]} * var(--cubie)), calc(${home[2]} * var(--cubie)))`,
                transition: turning ? `transform ${TURN_MS}ms ease-in-out` : "none",
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
