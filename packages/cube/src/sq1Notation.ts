/**
 * WCA Square-1 notation: `(x, y)` turns the top layer x and the bottom layer y
 * twelfths of a turn (30° each), clockwise looking at that layer, and `/`
 * turns the right half of the puzzle 180°. Reconstructions often drop the
 * parentheses, e.g. "1,0/ -1,-1/", or the comma too, e.g. "1-4/ 30/", and turn
 * the whole puzzle with y, y' or y2 (clockwise from above, like the top layer).
 */
export type Sq1Move =
  | { kind: "turn"; notation: string; top: number; bottom: number }
  | { kind: "slash"; notation: "/" }
  | { kind: "rotate"; notation: string; quarters: 1 | 2 | -1 };

// Turns with a comma, rotations, turns without a comma (one digit each), slashes, and anything else.
const TOKEN = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)|(-?\d+)\s*,\s*(-?\d+)|(y2|y'|y)(?![\w'])|(?<![\d-])(-?[0-6])(-?[0-6])(?![\d,])|(\/)|(\S+)/g;

/**
 * Parses moves such as "(1, 0) / (-3, 0) /", "1,0/ -1,-1/" or "y2 /0-4/", skipping `//`
 * comments. Throws on anything else, so a typo is caught early.
 */
export function parseSq1(moves: string): Sq1Move[] {
  const text = moves.replace(/\/\/.*$/gm, "");
  return [...text.matchAll(TOKEN)].map((match): Sq1Move => {
    if (match[8]) return { kind: "slash", notation: "/" };
    if (match[9]) throw new Error(`Unsupported Square-1 move "${match[9]}"`);
    if (match[5]) return { kind: "rotate", notation: match[5], quarters: match[5] === "y2" ? 2 : match[5] === "y'" ? -1 : 1 };
    const top = Number(match[1] ?? match[3] ?? match[6]);
    const bottom = Number(match[2] ?? match[4] ?? match[7]);
    if (Math.abs(top) > 6 || Math.abs(bottom) > 6) throw new Error(`Square-1 turn (${top}, ${bottom}) is more than half a turn`);
    return { kind: "turn", notation: `(${top}, ${bottom})`, top, bottom };
  });
}

/** The moves that undo `moves`: reversed, each turned the other way. */
export function invertSq1(moves: Sq1Move[]): Sq1Move[] {
  return moves.toReversed().map((move): Sq1Move => {
    if (move.kind === "slash") return move;
    if (move.kind === "rotate") return move.quarters === 2 ? move : { kind: "rotate", notation: move.quarters === 1 ? "y'" : "y", quarters: -move.quarters as 1 | -1 };
    return { ...move, notation: `(${-move.top}, ${-move.bottom})`, top: -move.top, bottom: -move.bottom };
  });
}

/** Moves back in notation, e.g. "(1, 0) / (-1, -1) /". */
export const formatSq1 = (moves: Sq1Move[]) => moves.map((move) => move.notation).join(" ");
