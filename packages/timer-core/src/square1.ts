// Square-1 position after a scramble, for drawing the scramble picture.
//
// The puzzle is 24 wedges of 30°: an edge is one wedge, a corner two. Wedges
// are numbered by where they sit when solved, the same way cubing.js numbers
// them (so the two can be checked against each other):
//
//   top    0–11, clockwise seen from above, starting with the front-left
//          corner's front half (0 is just left of the slice cut at the front)
//   bottom 12–23, clockwise seen from below, starting with the front edge
//
// WCA orientation: yellow top, white bottom, red front, blue left, green
// right, orange back. `(x, y)` turns the top x and the bottom y twelfths
// clockwise (each seen from its own face); `/` turns the right half 180°,
// swapping top slots 6–11 with bottom slots 12–17.

export type Square1Color = "U" | "D" | "F" | "B" | "L" | "R";

export interface Square1State {
  /** Wedge in each top slot (0–11). */
  top: number[];
  /** Wedge in each bottom slot (slot 12 + index). */
  bottom: number[];
  /** Whether the right half of the middle layer is flipped (an odd number of slashes). */
  middleFlipped: boolean;
}

const SIDE_COLORS: Square1Color[] = [
  // top 0–11
  "F", "L", "L", "L", "B", "B", "B", "R", "R", "R", "F", "F",
  // bottom 12–23
  "F", "F", "R", "R", "R", "B", "B", "B", "L", "L", "L", "F",
];

/** Edges are one wedge; every other wedge is half a corner, paired with the next one in its layer. */
const EDGES = new Set([2, 5, 8, 11, 12, 15, 18, 21]);

export const isEdgeWedge = (wedge: number) => EDGES.has(wedge);
/** The colour on the wedge's top or bottom face. */
export const faceColor = (wedge: number): Square1Color => (wedge < 12 ? "U" : "D");
/** The colour on the wedge's side. */
export const sideColor = (wedge: number): Square1Color => SIDE_COLORS[wedge];

export function solvedSquare1(): Square1State {
  return {
    top: Array.from({ length: 12 }, (_, i) => i),
    bottom: Array.from({ length: 12 }, (_, i) => 12 + i),
    middleFlipped: false,
  };
}

const rotate = (layer: number[], amount: number) => layer.map((_, i) => layer[(((i - amount) % 12) + 12) % 12]);

type Square1Move = { kind: "turn"; top: number; bottom: number } | { kind: "slash" };

/** Reads `(1, -3) / (0, 3) / …` (spaces optional). Returns null for anything else. */
export function parseSquare1(scramble: string): Square1Move[] | null {
  const moves: Square1Move[] = [];
  const pattern = /\s*(?:\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)|(\/))\s*/y;
  let match: RegExpExecArray | null;
  while (pattern.lastIndex < scramble.length && (match = pattern.exec(scramble))) {
    moves.push(match[3] ? { kind: "slash" } : { kind: "turn", top: Number(match[1]), bottom: Number(match[2]) });
  }
  return pattern.lastIndex >= scramble.trimEnd().length || scramble.trim() === "" ? moves : null;
}

/** The position after `scramble` from solved, or null if it can't be read. */
export function square1State(scramble: string): Square1State | null {
  const moves = parseSquare1(scramble);
  if (!moves) return null;
  let { top, bottom, middleFlipped } = solvedSquare1();
  for (const move of moves) {
    if (move.kind === "turn") {
      top = rotate(top, move.top);
      bottom = rotate(bottom, move.bottom);
    } else {
      [top, bottom] = [[...top.slice(0, 6), ...bottom.slice(0, 6)], [...top.slice(6), ...bottom.slice(6)]];
      middleFlipped = !middleFlipped;
    }
  }
  return { top, bottom, middleFlipped };
}

/** A piece in a layer: the slot it starts at and the wedges it covers (one for an edge, two for a corner). */
export interface Square1Piece {
  slot: number;
  wedges: number[];
}

/** Splits a layer into pieces, in slot order. */
export function layerPieces(layer: number[]): Square1Piece[] {
  // A piece begins at an edge or at a corner's first half (a corner's halves stay in order).
  const startsPiece = (slot: number) => isEdgeWedge(layer[slot]) || isFirstHalf(layer[slot]);
  let start = 0;
  while (!startsPiece(start)) start++;
  const pieces: Square1Piece[] = [];
  for (let n = 0; n < 12;) {
    const slot = (start + n) % 12;
    const wedge = layer[slot];
    const size = isEdgeWedge(wedge) ? 1 : 2;
    pieces.push({ slot, wedges: Array.from({ length: size }, (_, i) => layer[(slot + i) % 12]) });
    n += size;
  }
  return pieces;
}

/** Whether a corner wedge is its corner's first half, in slot order. */
function isFirstHalf(wedge: number): boolean {
  // Corners when solved: top (0,1) (3,4) (6,7) (9,10); bottom (13,14) (16,17) (19,20) (22,23).
  return wedge < 12 ? wedge % 3 === 0 : wedge % 3 === 1;
}
