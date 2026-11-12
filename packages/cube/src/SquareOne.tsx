"use client";

import { useEffect, useState } from "react";
import { IDENTITY, type Matrix } from "./model";
import { applySq1Move, pieceTurn, SQ1_PIECES, SQ1_SOLVED, type Face, type Side, type Vec3 } from "./sq1Model";
import { parseSq1, type Sq1Move } from "./sq1Notation";
import { SQ1_SOLVES, sq1SolutionMoves, type Sq1Solve } from "./sq1Solves";

// A Square-1 that plays a solve's scramble, then its solution, then moves on
// to the next solve, and loops. Like TwistyCube, pieces are prisms in CSS 3D;
// each move is a CSS transition on the turning pieces, baked into their
// rotations after.

const SLASH_MS = 420;
const turnMs = (move: Sq1Move) => (move.kind === "slash" ? SLASH_MS : 200 + 40 * Math.max(Math.abs(move.top), Math.abs(move.bottom)));
const PAUSE_MS = 110;

// Sticker colors, in TwistyCube's shades: black on top and white on the
// bottom, held to scramble with red (the darkest side) in front, so the slice
// runs through red and orange. Black is a lighter gray than the plastic so it shows.
const COLORS: Record<Side, string> = { top: "#2C2C33", bottom: "#F4F4F4", front: "#C41E3A", right: "#009E60", back: "#FF5800", left: "#0051BA" };
const PLASTIC = "#0D0D0F";
const STICKER_INSET = 0.08;

// matrix3d() is column-major.
const matrix3d = (m: Matrix) => `matrix3d(${m[0][0]},${m[1][0]},${m[2][0]},0,${m[0][1]},${m[1][1]},${m[2][1]},0,${m[0][2]},${m[1][2]},${m[2][2]},0,0,0,0,1)`;
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const length = (n: number) => `calc(var(--sq) * ${n.toFixed(5)})`;

/** A convex outline moved in by `d` on every side. */
function inset(points: [number, number][], d: number): [number, number][] {
  const area = points.reduce((sum, [x, y], i) => { const [nx, ny] = points[(i + 1) % points.length]; return sum + x * ny - nx * y; }, 0);
  const lines = points.map(([x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    const len = Math.hypot(nx - x, ny - y);
    // Inward is to the left of each side for a positive (clockwise, with y down) outline.
    const [ix, iy] = area > 0 ? [-(ny - y) / len, (nx - x) / len] : [(ny - y) / len, -(nx - x) / len];
    return { p: [x + ix * d, y + iy * d], dir: [(nx - x) / len, (ny - y) / len] };
  });
  return lines.map((line, i) => {
    const prev = lines[(i + lines.length - 1) % lines.length];
    const det = prev.dir[0] * line.dir[1] - prev.dir[1] * line.dir[0];
    const t = ((line.p[0] - prev.p[0]) * line.dir[1] - (line.p[1] - prev.p[1]) * line.dir[0]) / det;
    return [prev.p[0] + prev.dir[0] * t, prev.p[1] + prev.dir[1] * t];
  });
}

const toPoints = (points: [number, number][]) => points.map(([x, y]) => `${x.toFixed(4)},${y.toFixed(4)}`).join(" ");

function FaceView({ face }: { face: Face }) {
  const { center, u, v, width, height, points, sticker } = face;
  const n = cross(u, v);
  return (
    <div
      className="sq1-face"
      style={{
        left: length(-width / 2),
        top: length(-height / 2),
        width: length(width),
        height: length(height),
        transform: `translate3d(${center.map(length).join(",")}) matrix3d(${u.join(",")},0,${v.join(",")},0,${n.join(",")},0,0,0,0,1)`,
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <polygon points={toPoints(points)} fill={PLASTIC} />
        {sticker && (
          <polygon points={toPoints(inset(points, STICKER_INSET))} fill={COLORS[sticker]} stroke={COLORS[sticker]} strokeWidth={0.06} strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

// The pieces' faces never change, so they're drawn once.
const PIECE_FACES = SQ1_PIECES.map((piece) => piece.faces.map((face, i) => <FaceView key={i} face={face} />));

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SquareOne({ className, solves = SQ1_SOLVES }: {
  className?: string;
  /** The solves to cycle through, starting from a random one; by default mine. */
  solves?: readonly Sq1Solve[];
}) {
  const [rotations, setRotations] = useState<Matrix[]>(SQ1_SOLVED);
  const [move, setMove] = useState<Sq1Move | null>(null);

  useEffect(() => {
    // Rests solved without motion.
    if (solves.length === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const controller = new AbortController();
    const { signal } = controller;
    // The puzzle's state, mirrored outside React so the loop can plan from it.
    let current = SQ1_SOLVED;

    async function play(moves: Sq1Move[]) {
      for (const next of moves) {
        if (signal.aborted) return;
        setMove(next);
        await wait(turnMs(next));
        if (signal.aborted) return;
        current = applySq1Move(current, next);
        setRotations(current);
        setMove(null);
        await wait(PAUSE_MS);
      }
    }

    // Runs until the effect is cleaned up; nothing in it can reject.
    void (async () => {
      let index = Math.floor(Math.random() * solves.length);
      await wait(800);
      while (!signal.aborted) {
        const solve = solves[index];
        await play(parseSq1(solve.scramble));
        if (signal.aborted) return;
        await wait(1500);
        await play(parseSq1(sq1SolutionMoves(solve)));
        await wait(2200);
        index = (index + 1) % solves.length;
      }
    })();
    return () => controller.abort();
  }, [solves]);

  return (
    <div className={`square-one ${className ?? ""}`}>
      <div className="square-one-body">
        {SQ1_PIECES.map((piece, i) => {
          const rotation = rotations[i] ?? IDENTITY;
          const turn = move && pieceTurn(move, piece, rotation);
          const [x, y, z] = turn?.axis ?? [0, 1, 0];
          return (
            <div
              key={piece.name}
              className="sq1-piece"
              style={{
                transform: `rotate3d(${x},${y},${z},${turn?.degrees ?? 0}deg) ${matrix3d(rotation)}`,
                transition: turn ? `transform ${turnMs(move)}ms ease-in-out` : "none",
              }}
            >
              {PIECE_FACES[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
