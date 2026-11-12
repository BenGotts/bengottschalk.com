// Square-1 solves the links page's puzzle cycles through: each one's scramble,
// and how I solved it. A test checks that every solution solves its scramble.

export interface Sq1Solve {
  id: string;
  /** What the solve is, e.g. "official Square-1 PR". */
  title: string;
  scramble: string;
  solution: { label: string; moves: string }[];
}

// Each solved with CSP, OBL and PBL. The first is my official single PR.
export const SQ1_SOLVES: Sq1Solve[] = [
  {
    id: "pr",
    title: "official Square-1 PR",
    scramble: "(-2,0) / (-3,0) / (-4,-1) / (4,-2) / (6,-3) / (-4,0) / (3,0) / (-5,-4) / (0,-4) / (6,-2) /",
    solution: [
      { label: "CSP", moves: "(2,-4) / (0,-2) / (-1,0) / (-3,0) /" },
      { label: "OBL", moves: "(-2,-3) / (3,0) / (3,0) / (-1,-1) / (-3,0) / (-3,0) /" },
      { label: "PBL", moves: "(0,3) / (-3,0) / (3,3) / (0,-3) / (-3,4)" },
    ],
  },
  {
    id: "nec-2022",
    title: "4.45 at Northeast Champs 2022",
    scramble: "(1,0) / (5,-4) / (-5,4) / (3,0) / (0,-3) / (6,-3) / (-1,0) / (6,-3) / (-4,-5) / (2,-3) / (4,0) / (6,0)",
    solution: [
      { label: "CSP", moves: "(0,6) / (0,-4) / (-2,3) / (-1,-2) / (-3,0) /" },
      { label: "OBL", moves: "(-5,6) /" },
      { label: "PBL", moves: "(0,-3) / (3,0) / (-3,0) / (2,-1) / (-2,1) / (5,6)" },
    ],
  },
  {
    id: "nar-single",
    title: "4.75 NAR single",
    scramble: "(-5,0) / (0,-3) / (6,0) / (-4,-4) / (3,0) / (0,-3) / (1,-3) / (0,-3) / (-1,0) / (1,-4) / (-4,-4) / (-4,0) /",
    solution: [
      { label: "CSP", moves: "y2 / (0,-4) / (4,0) / (1,-4) / (3,0) /" },
      { label: "OBL", moves: "(-1,-3) / (0,-3) / (-3,0) / (-2,-2) / (-1,-1) /" },
      { label: "PBL", moves: "(6,4) / (-3,0) / (3,3) / (0,-3) / (3,6)" },
    ],
  },
];

/** A solve's moves in order, as one string. */
export const sq1SolutionMoves = (solve: Sq1Solve) => solve.solution.map((step) => step.moves).join(" ");
