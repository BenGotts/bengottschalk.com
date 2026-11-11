// Solves the self-solving cube plays (on the 404 page and after sending the
// contact form), picked at random each visit: each one's scramble, and how I
// solved it. Update one with a new PR or PB; a test checks that every solution
// solves its scramble.

export interface Solve {
  id: "pr" | "pb";
  /** What the solve is, e.g. "official 3x3 PR". */
  title: string;
  scramble: string;
  solution: { label: string; moves: string }[];
}

/** My official 3x3 single PR (CFOP, with a last layer skip). */
export const PR_SOLVE: Solve = {
  id: "pr",
  title: "official 3x3 PR",
  scramble: "R D' L F' U' L2 U' D2 B U2 B L2 B' U B2 U2 B2",
  solution: [
    { label: "Cross", moves: "y2 D R' F D2 F" },
    { label: "F2L 1+2", moves: "y R U' R2 U R" },
    { label: "F2L 3", moves: "y2 U R U' R' U R U' R' y R U' R'" },
    { label: "F2L 4 + LL skip", moves: "y' R U R' F R' F' R" },
  ],
};

/** My at-home 3x3 PB (CFOP, with an X-cross and a PLL skip). */
export const PB_SOLVE: Solve = {
  id: "pb",
  title: "at-home 3x3 PB",
  scramble: "D R2 U' F2 L2 F2 D2 U' B2 R2 D2 F' U' F D' U R F2 R",
  solution: [
    { label: "X-cross", moves: "x' z D2 R U2 Lw D'" },
    { label: "F2L 2", moves: "U R' U R" },
    { label: "F2L 3", moves: "L U L'" },
    { label: "F2L 4", moves: "U' L' U L U' F U F'" },
    { label: "Last layer", moves: "U2 R U R' U R U2 R'" },
  ],
};

export const SOLVES = [PR_SOLVE, PB_SOLVE];

/** A solve's moves in order, as one string. */
export const solutionMoves = (solve: Solve) => solve.solution.map((step) => step.moves).join(" ");
