import { parseScramble, type Axis, type Turn } from "./notation";

// The cube as 26 cubies, each a home position plus a rotation matrix. A
// cubie's current position is its rotation applied to its home.

export type Matrix = number[][];

export const CUBIES = [-1, 0, 1].flatMap((x) => [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => [x, y, z])))
  .filter(([x, y, z]) => x !== 0 || y !== 0 || z !== 0);
export const IDENTITY: Matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

/** A quarter turn about an axis, matching CSS rotateX/Y/Z(dir × 90deg). */
export function quarterTurn(axis: Axis, dir: 1 | -1): Matrix {
  if (axis === 0) return [[1, 0, 0], [0, 0, -dir], [0, dir, 0]];
  if (axis === 1) return [[0, 0, dir], [0, 1, 0], [-dir, 0, 0]];
  return [[0, -dir, 0], [dir, 0, 0], [0, 0, 1]];
}

export const multiply = (a: Matrix, b: Matrix): Matrix => a.map((row) => b[0].map((_, j) => row.reduce((sum, value, k) => sum + value * b[k][j], 0)));
export const apply = (m: Matrix, v: number[]) => m.map((row) => row.reduce((sum, value, k) => sum + value * v[k], 0));

/** Whether the cubie (by its rotation and home) is in the turning layer. */
export const inLayer = (turn: Turn, rotation: Matrix, home: number[]) => turn.layer === "all" || apply(rotation, home)[turn.axis] === turn.layer;

/** The cubies' rotations after a turn. */
export function applyTurn(rotations: Matrix[], turn: Turn): Matrix[] {
  const quarter = quarterTurn(turn.axis, turn.dir);
  const matrix = turn.amount === 2 ? multiply(quarter, quarter) : quarter;
  return rotations.map((rotation, i) => (inLayer(turn, rotation, CUBIES[i]) ? multiply(matrix, rotation) : rotation));
}

const sameMatrix = (a: Matrix, b: Matrix) => a.every((row, r) => row.every((v, c) => v === b[r][c]));
const isCenter = (home: number[]) => home.filter((v) => v !== 0).length === 1;

/**
 * Whether the cube is solved: every cubie turned the same way, so the cube is
 * whole, just possibly held differently. Centers only have to be in place,
 * since a center turned on the spot looks the same. With `inStartOrientation`,
 * it must also be held as it started (white on top, green in front).
 */
export function isSolved(rotations: Matrix[], { inStartOrientation = true } = {}): boolean {
  const corner = rotations[CUBIES.findIndex((home) => !isCenter(home))];
  if (inStartOrientation && !sameMatrix(corner, IDENTITY)) return false;
  return rotations.every((rotation, i) => {
    const home = CUBIES[i];
    if (!isCenter(home)) return sameMatrix(rotation, corner);
    const now = apply(rotation, home);
    return apply(corner, home).every((v, k) => v === now[k]);
  });
}

// Whole-cube rotations to try, shortest first, to turn a solved cube back to its start.
const REORIENTATIONS = ["", "y", "y'", "y2", "x", "x'", "x2", "z", "z'", "z2"]
  .flatMap((first) => (first ? ["", "y", "y'", "y2"].map((second) => `${first} ${second}`.trim()) : [""]))
  .toSorted((a, b) => a.split(" ").length - b.split(" ").length)
  .map((moves) => parseScramble(moves));

/** The rotations (e.g. `y'`) that turn a solved cube back to how it started, or [] if it already is. */
export function reorientation(rotations: Matrix[]): Turn[] {
  return REORIENTATIONS.find((turns) => isSolved(turns.reduce(applyTurn, rotations))) ?? [];
}
