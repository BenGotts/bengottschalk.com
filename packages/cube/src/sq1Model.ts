import { apply, IDENTITY, multiply, type Matrix } from "./model";
import { parseSq1, type Sq1Move } from "./sq1Notation";

// The Square-1 as 18 pieces (8 corners, 8 edges and the two middle halves),
// each a prism with a home shape plus a rotation matrix, like the 3×3's
// cubies. In CSS axes: x to the right, y down, z toward the viewer, with the
// puzzle 2 units wide and each layer a third of its height. Angles around the
// vertical axis run from +x (right) toward +z (front).

export type Vec3 = [number, number, number];
export type Side = "top" | "bottom" | "front" | "back" | "left" | "right";

export interface Face {
  /** Where the face's center is, and its width (u) and height (v) directions; u × v points out. */
  center: Vec3;
  u: Vec3;
  v: Vec3;
  width: number;
  height: number;
  /** The face's outline, from its top-left corner along u and v. */
  points: [number, number][];
  /** The sticker's side, or none for an inside face. */
  sticker?: Side;
}

export interface Sq1Piece {
  name: string;
  /** Where the piece's middle is when solved, to tell which layer or half it's in. */
  centroid: Vec3;
  /** The prism's corners when solved, to check a slash doesn't cut through it. */
  corners: Vec3[];
  faces: Face[];
}

const RAD = Math.PI / 180;
const T = Math.tan(15 * RAD);
const EPSILON = 1e-6;

// The slash cuts along the line from 105° (just left of the front edge) to
// 285°, and turns the half on the right of it about this axis, square to the
// cut. (Real scrambles only work with the cut there; a test checks.)
const CUT = 105 * RAD;
export const SLASH_AXIS: Vec3 = [Math.sin(CUT), 0, -Math.cos(CUT)];

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const rotateXZ = ([x, z]: [number, number], degrees: number): [number, number] => {
  const c = Math.cos(degrees * RAD), s = Math.sin(degrees * RAD);
  return [x * c - z * s, x * s + z * c];
};

/** The side a point on the puzzle's outside faces, if any. */
function outerSide(a: [number, number], b: [number, number]): Side | undefined {
  const on = (i: 0 | 1, value: number) => Math.abs(a[i] - value) < EPSILON && Math.abs(b[i] - value) < EPSILON;
  if (on(0, 1)) return "right";
  if (on(0, -1)) return "left";
  if (on(1, 1)) return "front";
  if (on(1, -1)) return "back";
}

/** A prism: a convex outline in the xz plane, from y0 up top down to y1. */
function prism(name: string, outline: [number, number][], y0: number, y1: number, caps: { top?: Side; bottom?: Side }): Sq1Piece {
  const xs = outline.map((p) => p[0]), zs = outline.map((p) => p[1]);
  const [xMin, xMax, zMin, zMax] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  const middle: [number, number] = [xs.reduce((a, b) => a + b) / xs.length, zs.reduce((a, b) => a + b) / zs.length];
  const box = { width: xMax - xMin, height: zMax - zMin };
  const faces: Face[] = [
    // Facing up: u along x, v along z.
    { center: [(xMin + xMax) / 2, y0, (zMin + zMax) / 2], u: [1, 0, 0], v: [0, 0, 1], ...box, points: outline.map(([x, z]) => [x - xMin, z - zMin]), sticker: caps.top },
    // Facing down: u along x, v against z.
    { center: [(xMin + xMax) / 2, y1, (zMin + zMax) / 2], u: [1, 0, 0], v: [0, 0, -1], ...box, points: outline.map(([x, z]) => [x - xMin, zMax - z]), sticker: caps.bottom },
  ];
  outline.forEach((from, i) => {
    let [a, b] = [from, outline[(i + 1) % outline.length]];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    let u: Vec3 = [(b[0] - a[0]) / length, 0, (b[1] - a[1]) / length];
    // With v down, u × v = (-u.z, 0, u.x); flip u if that points inward.
    const mid: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (-u[2] * (mid[0] - middle[0]) + u[0] * (mid[1] - middle[1]) < 0) {
      u = [-u[0], 0, -u[2]];
      [a, b] = [b, a];
    }
    const height = y1 - y0;
    faces.push({
      center: [mid[0], (y0 + y1) / 2, mid[1]], u, v: [0, 1, 0], width: length, height,
      points: [[0, 0], [length, 0], [length, height], [0, height]],
      sticker: outerSide(a, b),
    });
  });
  return {
    name,
    centroid: [middle[0], (y0 + y1) / 2, middle[1]],
    corners: outline.flatMap(([x, z]): Vec3[] => [[x, y0, z], [x, y1, z]]),
    faces,
  };
}

const EDGE: [number, number][] = [[0, 0], [1, -T], [1, T]];
const CORNER: [number, number][] = [[0, 0], [1, T], [1, 1], [T, 1]];
const CUT_FRONT: [number, number] = [-T, 1];
const CUT_BACK: [number, number] = [T, -1];

/** The pieces, solved, in scrambling orientation: black on top, red in front. */
export const SQ1_PIECES: Sq1Piece[] = [
  ...(["top", "bottom"] as const).flatMap((layer) => {
    const [y0, y1] = layer === "top" ? [-1, -1 / 3] : [1 / 3, 1];
    const caps = layer === "top" ? { top: "top" as const } : { bottom: "bottom" as const };
    return [0, 90, 180, 270].flatMap((angle) => [
      prism(`${layer} edge ${angle}`, EDGE.map((p) => rotateXZ(p, angle)), y0, y1, caps),
      prism(`${layer} corner ${angle + 45}`, CORNER.map((p) => rotateXZ(p, angle)), y0, y1, caps),
    ]);
  }),
  prism("middle right", [CUT_FRONT, [1, 1], [1, -1], CUT_BACK], -1 / 3, 1 / 3, {}),
  prism("middle left", [CUT_BACK, [-1, -1], [-1, 1], CUT_FRONT], -1 / 3, 1 / 3, {}),
];

/** A rotation about a unit axis, matching CSS rotate3d(). */
export function rotation(axis: Vec3, degrees: number): Matrix {
  const c = Math.cos(degrees * RAD), s = Math.sin(degrees * RAD), k = 1 - c;
  const [x, y, z] = axis;
  return [
    [c + x * x * k, x * y * k - z * s, x * z * k + y * s],
    [y * x * k + z * s, c + y * y * k, y * z * k - x * s],
    [z * x * k - y * s, z * y * k + x * s, c + z * z * k],
  ];
}

/** How a piece turns in a move, or null if it stays put. */
export function pieceTurn(move: Sq1Move, piece: Sq1Piece, current: Matrix): { axis: Vec3; degrees: number } | null {
  const [, y] = apply(current, piece.centroid);
  if (move.kind === "rotate") return { axis: [0, 1, 0], degrees: -90 * move.quarters };
  if (move.kind === "slash") return dot(apply(current, piece.centroid) as Vec3, SLASH_AXIS) > 0 ? { axis: SLASH_AXIS, degrees: 180 } : null;
  // Clockwise from above turns +x toward +z, which is rotateY(-angle).
  if (y < -0.5 && move.top) return { axis: [0, 1, 0], degrees: -30 * move.top };
  if (y > 0.5 && move.bottom) return { axis: [0, 1, 0], degrees: 30 * move.bottom };
  return null;
}

/** Whether a slash can turn now: no piece straddles the cut. */
export function canSlash(rotations: Matrix[]): boolean {
  return SQ1_PIECES.every((piece, i) => {
    const sides = piece.corners.map((corner) => dot(apply(rotations[i], corner) as Vec3, SLASH_AXIS));
    return sides.every((side) => side > -EPSILON) || sides.every((side) => side < EPSILON);
  });
}

/** The pieces' rotations after a move. Throws on a slash a piece is in the way of. */
export function applySq1Move(rotations: Matrix[], move: Sq1Move): Matrix[] {
  if (move.kind === "slash" && !canSlash(rotations)) throw new Error("A piece is in the way of the slash");
  return rotations.map((current, i) => {
    const turn = pieceTurn(move, SQ1_PIECES[i], current);
    return turn ? multiply(rotation(turn.axis, turn.degrees), current) : current;
  });
}

export const SQ1_SOLVED: Matrix[] = SQ1_PIECES.map(() => IDENTITY);

const same = (a: Matrix, b: Matrix) => a.every((row, r) => row.every((value, c) => Math.abs(value - b[r][c]) < EPSILON));

/**
 * Whether the puzzle is solved: every piece turned the same way, so it's
 * whole, just possibly held differently. With `inStartOrientation`, it must
 * also be held as it started (black on top, red in front).
 */
export function isSq1Solved(rotations: Matrix[], { inStartOrientation = true } = {}): boolean {
  if (inStartOrientation && !same(rotations[0], IDENTITY)) return false;
  return rotations.every((m) => same(m, rotations[0]));
}

const REORIENTATIONS = ["", "y", "y'", "y2"].map((moves) => parseSq1(moves));

/** The rotation (e.g. `y2`) that turns a solved puzzle back to how it started, or [] if it already is. */
export function sq1Reorientation(rotations: Matrix[]): Sq1Move[] {
  return REORIENTATIONS.find((moves) => isSq1Solved(moves.reduce(applySq1Move, rotations))) ?? [];
}
