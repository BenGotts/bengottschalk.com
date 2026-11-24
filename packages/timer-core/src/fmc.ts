// Fewest Moves solutions, read the way a WCA judge reads them (Article E2c,
// with the notation of Regulation 12a for the 3x3x3).
//
// Allowed moves (12a): face moves (R, U2, F'), outer block moves (Rw, 2Rw)
// and rotations (x, y2, z'). Slice moves (M, E, S) aren't defined notation,
// so a solution with one is a DNF (E2c4). The result is counted in Outer
// Block Turn Metric, where rotations are free (E2d, 12a5); the 80-move limit
// is counted in Execution Turn Metric, where they count (E2d1, 12a6).

/** E2b: 60 minutes to find and write a solution. */
export const FMC_TIME_LIMIT_MS = 3_600_000;
/** E2d1: at most 80 moves, rotations included (ETM). */
export const FMC_MAX_MOVES = 80;

export interface FmcSolution {
  /** The moves as a judge reads them, in standard notation (`R`, `Rw'`, `y2`). */
  moves: string[];
  /** The result: face and outer block moves (OBTM, E2d). */
  count: number;
  /** For the 80-move limit: rotations count too (ETM, E2d1). */
  etm: number;
  /** Words that aren't 3x3x3 notation (a slice move, say), as written. */
  invalid: string[];
}

// One move: an optional 2 before an outer block move, the face (or the
// rotation's axis), and the amount. After E2c6 capitalization doesn't
// matter, so the text is upper-cased first ("r" is R, "uw" is Uw, "Y" is y).
const MOVE = /(2?)([URFDLB])(W?)(2'|'2|2|')?|([XYZ])(2'|'2|2|')?/y;

/** Reads a solution. `//` starts a note that runs to the end of the line and isn't part of it. */
export function parseFmcSolution(text: string): FmcSolution {
  const result: FmcSolution = { moves: [], count: 0, etm: 0, invalid: [] };
  const lines = text.replaceAll("’", "'").split("\n").map((line) => line.replace(/\/\/.*$/, ""));
  // E2c4: only numbers, letters and apostrophes count; other symbols are disregarded.
  const words = lines.join(" ").replaceAll(/[^A-Za-z0-9'\s]/g, "").split(/\s+/).filter(Boolean);
  for (const word of words) {
    const moves = readWord(word.toUpperCase());
    if (!moves) {
      result.invalid.push(word);
      continue;
    }
    for (const move of moves) {
      result.moves.push(move);
      result.etm += 1;
      if (!"xyz".includes(move[0])) result.count += 1;
    }
  }
  return result;
}

/** The moves in one word (moves can be written without spaces, like `RUR'U'`), or null if any of it isn't notation. */
function readWord(word: string): string[] | null {
  const moves: string[] = [];
  MOVE.lastIndex = 0;
  while (MOVE.lastIndex < word.length) {
    const match = MOVE.exec(word);
    if (!match) return null;
    const [, layers, face, wide, faceAmount, axis, axisAmount] = match;
    // 12a2: "2" before a move only goes with an outer block move (2Rw); 2R isn't notation.
    if (face && layers && !wide) return null;
    const amount = faceAmount ?? axisAmount ?? "";
    // E2c4++: a move with both an apostrophe and a 2 is read as if there were no apostrophe.
    const suffix = amount.includes("2") ? "2" : amount;
    moves.push(face ? `${face}${wide ? "w" : ""}${suffix}` : `${axis.toLowerCase()}${suffix}`);
  }
  return moves;
}

/** Undoes a sequence of moves: in reverse order, each turned the other way. */
export function invertMoves(moves: readonly string[]): string[] {
  return [...moves].reverse().map((move) => (move.endsWith("2") ? move : move.endsWith("'") ? move.slice(0, -1) : `${move}'`));
}

export type FmcProblem =
  | { kind: "empty" }
  | { kind: "not-notation"; words: string[] }
  | { kind: "too-long"; etm: number };

/** What stops a solution counting, before checking it solves the cube (that needs the puzzle), or null. */
export function fmcProblem(solution: FmcSolution): FmcProblem | null {
  if (solution.invalid.length > 0) return { kind: "not-notation", words: solution.invalid };
  if (solution.moves.length === 0) return { kind: "empty" };
  if (solution.etm > FMC_MAX_MOVES) return { kind: "too-long", etm: solution.etm };
  return null;
}

/** The problem, said plainly. */
export function describeFmcProblem(problem: FmcProblem): string {
  switch (problem.kind) {
    case "empty":
      return "Write a solution first.";
    case "not-notation": {
      const slice = problem.words.some((w) => /^[MES]/i.test(w));
      return `${problem.words.map((w) => `“${w}”`).join(", ")} ${problem.words.length === 1 ? "isn't" : "aren't"} WCA notation`
        + (slice ? " (slice moves aren't allowed: M is R L' x', say)" : "")
        + ". Only face turns, outer block turns like Rw and rotations count (Regulation E2c4).";
    }
    case "too-long":
      return `That's ${problem.etm} moves counting rotations; the limit is ${FMC_MAX_MOVES} (Regulation E2d1).`;
  }
}

/**
 * E2e++: a solution sharing its first four or more moves with the inverse
 * scramble is likely to be ruled as taken from the scramble (a DNF at the
 * Delegate's discretion). A warning, not a rule the timer enforces.
 */
export function startsLikeInverseScramble(solution: readonly string[], scramble: string, length = 4): boolean {
  const inverse = invertMoves(parseFmcSolution(scramble).moves);
  if (solution.length < length || inverse.length < length) return false;
  return solution.slice(0, length).every((move, i) => move === inverse[i]);
}
