// Square-1 solves the links page's puzzle cycles through: each one's scramble,
// and how I solved it. A test checks that every solution solves its scramble.

export interface Sq1Solve {
  id: string;
  /** What the solve is, e.g. "official Square-1 PR". */
  title: string;
  scramble: string;
  solution: { label: string; moves: string }[];
}

/** My official Square-1 single PR (CSP, OBL, PBL). */
export const SQ1_SOLVES: Sq1Solve[] = [
  {
    id: "pr",
    title: "official Square-1 PR",
    scramble: "(-2,0) / (-3,0) / (-4,-1) / (4,-2) / (6,-3) / (-4,0) / (3,0) / (-5,-4) / (0,-4) / (6,-2) /",
    solution: [
      { label: "CSP", moves: "2,-4/ 0,-2/ -1,0/ -3,0/" },
      { label: "OBL", moves: "-2,-3/ 3,0/ 3,0/ -1,-1/ -3,0/ -3,0/" },
      { label: "PBL", moves: "0,3/ -3,0/ 3,3/ 0,-3/ -3,4" },
    ],
  },
];

/** A solve's moves in order, as one string. */
export const sq1SolutionMoves = (solve: Sq1Solve) => solve.solution.map((step) => step.moves).join(" ");
