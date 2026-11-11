/**
 * WCA cube notation for the 3×3 face turns (R, U', F2, …), wide turns (Rw or
 * r, …) and whole-cube rotations (x, y, z), as turns in CSS axes: x to the right, y down, z toward
 * the viewer, with the standard scrambling orientation (white on top, green
 * in front).
 */
export type Axis = 0 | 1 | 2;

export interface Turn {
  /** The move as written, e.g. "U'". */
  notation: string;
  axis: Axis;
  /** Which layer along the axis (-1 or 1), or the whole cube for a rotation. */
  layer: -1 | 1 | "all";
  /** A wide turn: the layer and the middle layer next to it. */
  wide?: boolean;
  /** The sign of the CSS rotation for one quarter turn. */
  dir: -1 | 1;
  /** Quarter turns: 1, or 2 for a half turn. */
  amount: 1 | 2;
}

// A face's clockwise quarter turn (looking at that face) as a CSS rotation.
const FACES: Record<string, Pick<Turn, "axis" | "layer" | "dir">> = {
  R: { axis: 0, layer: 1, dir: 1 },
  L: { axis: 0, layer: -1, dir: -1 },
  U: { axis: 1, layer: -1, dir: -1 },
  D: { axis: 1, layer: 1, dir: 1 },
  F: { axis: 2, layer: 1, dir: 1 },
  B: { axis: 2, layer: -1, dir: -1 },
  // Rotations turn the whole cube like R, U and F.
  x: { axis: 0, layer: "all", dir: 1 },
  y: { axis: 1, layer: "all", dir: -1 },
  z: { axis: 2, layer: "all", dir: 1 },
};

/**
 * Parses moves such as "R D' L F2", "x' z D2 Lw" or "y2 r U", skipping `//`
 * comments. Throws on anything else, so a typo is caught early.
 */
export function parseScramble(scramble: string): Turn[] {
  return scramble.replace(/\/\/.*$/gm, "").trim().split(/\s+/).filter(Boolean).map((notation) => {
    const match = /^(?:([RLUDFB])w|([rludfb])|([RLUDFBxyz]))(2|')?$/.exec(notation);
    if (!match) throw new Error(`Unsupported move "${notation}"`);
    const wideFace = match[1] ?? match[2]?.toUpperCase();
    const face = FACES[wideFace ?? match[3]];
    const prime = match[4] === "'";
    return {
      notation,
      ...face,
      ...(wideFace && { wide: true }),
      dir: prime ? (-face.dir as -1 | 1) : face.dir,
      amount: match[4] === "2" ? 2 : 1,
    };
  });
}

/** The moves that undo `turns`: reversed, each turned the other way. */
export function invert(turns: Turn[]): Turn[] {
  return turns.toReversed().map((turn) => ({ ...turn, dir: -turn.dir as -1 | 1 }));
}
