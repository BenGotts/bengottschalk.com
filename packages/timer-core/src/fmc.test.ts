import { describe, expect, it } from "vitest";
import { describeFmcProblem, fmcProblem, FMC_MAX_MOVES, invertMoves, parseFmcSolution, startsLikeInverseScramble } from "./fmc";

describe("parseFmcSolution", () => {
  it("counts face and outer block moves once each, rotations not at all (OBTM, 12a5)", () => {
    const read = parseFmcSolution("R U2 F' x Rw y2 2Fw' z'");
    expect(read.moves).toEqual(["R", "U2", "F'", "x", "Rw", "y2", "Fw'", "z'"]);
    expect(read.count).toBe(5);
    expect(read.etm).toBe(8);
    expect(read.invalid).toEqual([]);
  });

  it("leaves out notes after //", () => {
    expect(parseFmcSolution("R U // EO\nF // block").moves).toEqual(["R", "U", "F"]);
  });

  it("doesn't allow slice moves or other notation (E2c4)", () => {
    expect(parseFmcSolution("M2 R E S'").invalid).toEqual(["M2", "E", "S'"]);
    expect(parseFmcSolution("R3' 3Rw 2R Q").invalid).toEqual(["R3'", "3Rw", "2R", "Q"]);
  });

  it("reads wrong capitals as the move meant (E2c6): r is R, not Rw", () => {
    expect(parseFmcSolution("r uw UW uW Y").moves).toEqual(["R", "Uw", "Uw", "Uw", "y"]);
  });

  it("disregards symbols other than letters, numbers and apostrophes (E2c4)", () => {
    expect(parseFmcSolution("[x] (R U') R++, F.").moves).toEqual(["x", "R", "U'", "R", "F"]);
    expect(parseFmcSolution("RUR'U'").moves).toEqual(["R", "U", "R'", "U'"]);
    expect(parseFmcSolution("R ’").invalid).toEqual(["'"]);
  });

  it("reads a move with both an apostrophe and a 2 as a 2 (E2c4++)", () => {
    expect(parseFmcSolution("R2' U'2").moves).toEqual(["R2", "U2"]);
  });
});

describe("fmcProblem", () => {
  it("is fine for a solution in notation", () => {
    expect(fmcProblem(parseFmcSolution("R U R'"))).toBeNull();
  });
  it("needs a solution", () => {
    expect(fmcProblem(parseFmcSolution(" // only a note"))).toEqual({ kind: "empty" });
  });
  it("names moves that aren't notation, with help for slice moves", () => {
    const problem = fmcProblem(parseFmcSolution("R M U"));
    expect(problem).toEqual({ kind: "not-notation", words: ["M"] });
    expect(describeFmcProblem(problem!)).toMatch(/“M” isn't WCA notation \(slice moves/);
  });
  it("allows 80 moves counting rotations (ETM, E2d1), not 81", () => {
    expect(fmcProblem(parseFmcSolution("R ".repeat(FMC_MAX_MOVES)))).toBeNull();
    expect(fmcProblem(parseFmcSolution(`${"R ".repeat(79)}x y`))).toEqual({ kind: "too-long", etm: 81 });
  });
});

describe("invertMoves", () => {
  it("reverses the moves and turns each the other way", () => {
    expect(invertMoves(["R", "U'", "F2", "Rw", "x'"])).toEqual(["x", "Rw'", "F2", "U", "R'"]);
  });
});

describe("startsLikeInverseScramble", () => {
  it("spots a solution that starts like the inverse scramble (E2e++)", () => {
    expect(startsLikeInverseScramble(["F'", "U", "R", "U'", "L"], "B R2 U R' U' F")).toBe(true);
    expect(startsLikeInverseScramble(["F'", "U", "R", "L"], "B R2 U R' U' F")).toBe(false);
  });
});
