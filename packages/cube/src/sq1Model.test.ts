import { describe, expect, it } from "vitest";
import { applySq1Move, canSlash, isSq1Solved, SQ1_SOLVED } from "./sq1Model";
import { invertSq1, parseSq1 } from "./sq1Notation";
import { SQ1_SOLVES, sq1SolutionMoves } from "./sq1Solves";

const play = (moves: string, from = SQ1_SOLVED) => parseSq1(moves).reduce(applySq1Move, from);

// Random-state scrambles from cubing.js, as the WCA's TNoodle makes them.
const SCRAMBLES = [
  "(0, -1) / (-3, 0) / (-3, 0) / (-5, 4) / (-1, 2) / (6, 0) / (0, -2) / (-3, 0) / (4, 0) / (-1, 2) / (4, 0) / (-4, 3) / (-2, 0) / (-2, 0)",
  "(1, 0) / (3, 3) / (5, -4) / (-3, 3) / (-2, -2) / (-1, 0) / (0, 3) / (6, 0) / (0, -2) / (-1, 0) / (2, 0) / (6, -1)",
  "(0, -1) / (0, 3) / (0, -3) / (4, -2) / (3, 0) / (-3, 0) / (0, -3) / (-4, 0) / (0, 3) / (6, 0) / (0, -2) / (5, 0) / (6, 2) /",
];

describe("Square-1 model", () => {
  it("can slash when solved or after a (1, 0), but not after a (-1, 0)", () => {
    expect(canSlash(SQ1_SOLVED)).toBe(true);
    expect(() => play("(1, 0) /")).not.toThrow();
    expect(() => play("(-1, 0) /")).toThrow();
  });

  it("plays real scrambles, with every slash allowed", () => {
    for (const scramble of SCRAMBLES) {
      const scrambled = play(scramble);
      expect(isSq1Solved(scrambled)).toBe(false);
      expect(isSq1Solved(invertSq1(parseSq1(scramble)).reduce(applySq1Move, scrambled))).toBe(true);
    }
  });

  it("is solved after a slash done twice, or a full turn of a layer", () => {
    expect(isSq1Solved(play("/ /"))).toBe(true);
    expect(isSq1Solved(play("(6, 0) (6, 0)"))).toBe(true);
    expect(isSq1Solved(play("/"))).toBe(false);
  });

  it("parses moves with or without parentheses", () => {
    expect(parseSq1("1,0/ -1,-1/").map((m) => m.notation)).toEqual(["(1, 0)", "/", "(-1, -1)", "/"]);
    expect(() => parseSq1("(1, 0) R")).toThrow();
  });
});

describe("Square-1 solves", () => {
  it.each(SQ1_SOLVES.map((solve) => [solve.id, solve] as const))("%s: the solution solves the scramble", (_, solve) => {
    const scrambled = play(solve.scramble);
    expect(isSq1Solved(scrambled)).toBe(false);
    expect(isSq1Solved(play(sq1SolutionMoves(solve), scrambled))).toBe(true);
  });
});
