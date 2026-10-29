import { describe, expect, it } from "vitest";
import { PR_SCRAMBLE, PR_SOLUTION } from "@/content/prScramble";
import { applyTurn, CUBIES, IDENTITY, isSolved, reorientation } from "./model";
import { invert, parseScramble } from "./notation";

const play = (moves: string, from = CUBIES.map(() => IDENTITY)) => parseScramble(moves).reduce(applyTurn, from);

describe("cube model", () => {
  it("turns layers the way WCA notation means", () => {
    // R moves the front-right edge up to the top; F moves the top-front edge to the right.
    const r = play("R");
    expect(r[CUBIES.findIndex((h) => h.join() === "1,0,1")].map((row) => row.join())).toEqual(["1,0,0", "0,0,-1", "0,1,0"]);
    expect(isSolved(play("R U R' U'"))).toBe(false);
    expect(isSolved(play("R U R' U' R U R' U' R U R' U' R U R' U' R U R' U' R U R' U'"))).toBe(true);
  });

  it("is solved after a scramble and its inverse", () => {
    const scrambled = play(PR_SCRAMBLE);
    expect(isSolved(scrambled)).toBe(false);
    expect(isSolved(invert(parseScramble(PR_SCRAMBLE)).reduce(applyTurn, scrambled))).toBe(true);
  });

  it("is solved by my PR solution, then turned back to how it started", () => {
    const solution = PR_SOLUTION.map((step) => step.moves).join(" ");
    const solved = play(solution, play(PR_SCRAMBLE));
    expect(isSolved(solved, { inStartOrientation: false })).toBe(true);
    expect(isSolved(reorientation(solved).reduce(applyTurn, solved))).toBe(true);
  });

  it("needs no reorientation when it's already as it started", () => {
    expect(reorientation(play(""))).toEqual([]);
    expect(reorientation(play("y")).map((turn) => turn.notation)).toEqual(["y'"]);
  });
});
