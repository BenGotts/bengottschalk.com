import { formatSq1, invertSq1, parseSq1 } from "./sq1Notation";

// Square-1 solves the links page's puzzle cycles through: each one's scramble,
// and how I solved it. A test checks that every solution solves its scramble.

export interface Sq1Solve {
  id: string;
  /** What the solve is, e.g. "official Square-1 PR". */
  title: string;
  scramble: string;
  solution: { label: string; moves: string }[];
}

/** A stand-in until real reconstructions go in: a WCA-style scramble, undone move by move. */
const placeholder = (id: string, scramble: string): Sq1Solve => ({
  id,
  title: "placeholder",
  scramble,
  solution: [{ label: "Scramble, undone", moves: formatSq1(invertSq1(parseSq1(scramble))) }],
});

// TODO: replace with my Square-1 scrambles and reconstructions.
export const SQ1_SOLVES: Sq1Solve[] = [
  placeholder("placeholder-1", "(0, -1) / (-3, 0) / (-3, 0) / (-5, 4) / (-1, 2) / (6, 0) / (0, -2) / (-3, 0) / (4, 0) / (-1, 2) / (4, 0) / (-4, 3) / (-2, 0) / (-2, 0)"),
  placeholder("placeholder-2", "(1, 0) / (3, 3) / (5, -4) / (-3, 3) / (-2, -2) / (-1, 0) / (0, 3) / (6, 0) / (0, -2) / (-1, 0) / (2, 0) / (6, -1)"),
];

/** A solve's moves in order, as one string. */
export const sq1SolutionMoves = (solve: Sq1Solve) => solve.solution.map((step) => step.moves).join(" ");
