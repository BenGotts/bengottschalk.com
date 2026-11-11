import { describe, expect, it } from "vitest";
import { PR_SOLVE, SOLVES, solutionMoves } from "@/content/solves";
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

  it("turns a wide move as the opposite face turn plus a rotation", () => {
    // Lw turns the left two layers, which leaves the cube as R with an x' rotation.
    expect(play("Lw")).toEqual(play("R x'"));
    expect(play("r'")).toEqual(play("L' x'"));
    expect(play("Uw2")).toEqual(play("D2 y2"));
  });

  it("is solved after a scramble and its inverse", () => {
    const scrambled = play(PR_SOLVE.scramble);
    expect(isSolved(scrambled)).toBe(false);
    expect(isSolved(invert(parseScramble(PR_SOLVE.scramble)).reduce(applyTurn, scrambled))).toBe(true);
  });

  it.each(SOLVES.map((solve) => [solve.title, solve] as const))("is solved by my %s solution, then turned back to how it started", (_, solve) => {
    const scrambled = play(solve.scramble);
    expect(isSolved(scrambled)).toBe(false);
    const solved = play(solutionMoves(solve), scrambled);
    expect(isSolved(solved, { inStartOrientation: false })).toBe(true);
    expect(isSolved(reorientation(solved).reduce(applyTurn, solved))).toBe(true);
  });

  it("needs no reorientation when it's already as it started", () => {
    expect(reorientation(play(""))).toEqual([]);
    expect(reorientation(play("y")).map((turn) => turn.notation)).toEqual(["y'"]);
  });
});
