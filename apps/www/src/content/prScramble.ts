// My 3x3 single PR: the scramble, and how I solved it (CFOP, with a last
// layer skip). The cube on the 404 page and after sending the contact form
// plays the scramble, then this solution. Update both with a new PR; a test
// checks that the solution solves the scramble.
export const PR_SCRAMBLE = "R D' L F' U' L2 U' D2 B U2 B L2 B' U B2 U2 B2";

export const PR_SOLUTION = [
  { label: "Cross", moves: "y2 D R' F D2 F" },
  { label: "F2L 1+2", moves: "y R U' R2 U R" },
  { label: "F2L 3", moves: "y2 U R U' R' U R U' R' y R U' R'" },
  { label: "F2L 4 + LL skip", moves: "y' R U R' F R' F' R" },
];
