/**
 * WCA Square-1 notation: `(x, y)` turns the top layer x and the bottom layer y
 * twelfths of a turn (30° each), clockwise looking at that layer, and `/`
 * turns the right half of the puzzle 180°. Reconstructions often drop the
 * parentheses, e.g. "1,0/ -1,-1/".
 */
export type Sq1Move =
  | { kind: "turn"; notation: string; top: number; bottom: number }
  | { kind: "slash"; notation: "/" };

const TOKEN = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)|(-?\d+)\s*,\s*(-?\d+)|(\/)|(\S+)/g;

/**
 * Parses moves such as "(1, 0) / (-3, 0) /" or "1,0/ -1,-1/", skipping `//`
 * comments. Throws on anything else, so a typo is caught early.
 */
export function parseSq1(moves: string): Sq1Move[] {
  const text = moves.replace(/\/\/.*$/gm, "");
  return [...text.matchAll(TOKEN)].map((match): Sq1Move => {
    if (match[5]) return { kind: "slash", notation: "/" };
    if (match[6]) throw new Error(`Unsupported Square-1 move "${match[6]}"`);
    const top = Number(match[1] ?? match[3]);
    const bottom = Number(match[2] ?? match[4]);
    if (Math.abs(top) > 6 || Math.abs(bottom) > 6) throw new Error(`Square-1 turn (${top}, ${bottom}) is more than half a turn`);
    return { kind: "turn", notation: `(${top}, ${bottom})`, top, bottom };
  });
}

/** The moves that undo `moves`: reversed, each turned the other way. */
export function invertSq1(moves: Sq1Move[]): Sq1Move[] {
  return moves.toReversed().map((move) => (move.kind === "slash" ? move : { ...move, notation: `(${-move.top}, ${-move.bottom})`, top: -move.top, bottom: -move.bottom }));
}

/** Moves back in notation, e.g. "(1, 0) / (-1, -1) /". */
export const formatSq1 = (moves: Sq1Move[]) => moves.map((move) => move.notation).join(" ");
