import { describe, expect, it } from "vitest";
import { compareMultiBlind, countFmcMoves, multiBlindPoints, solveValue, type Solve } from "./solve";

const solve = (overrides: Partial<Solve>): Solve => ({
  id: "x", eventId: "333", sessionId: "main-333", timeMs: 10000, penalty: "none", scramble: "", comment: "",
  startedAt: 0, endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: null, entry: "timer",
  createdAt: 0, updatedAt: 0, deletedAt: null, ...overrides,
});

describe("solveValue", () => {
  it("adds +2 and treats DNF as Infinity", () => {
    expect(solveValue(solve({}))).toBe(10000);
    expect(solveValue(solve({ penalty: "+2" }))).toBe(12000);
    expect(solveValue(solve({ penalty: "dnf" }))).toBe(Infinity);
  });
  it("uses moves for FMC", () => {
    expect(solveValue(solve({ eventId: "333fm", fmc: { solution: "R", moves: 28 } }))).toBe(28);
  });
});

describe("Multi-Blind", () => {
  it("scores points the WCA way", () => {
    expect(multiBlindPoints({ solved: 3, attempted: 4 })).toBe(2);
    expect(multiBlindPoints({ solved: 2, attempted: 4 })).toBe(0);
    expect(multiBlindPoints({ solved: 1, attempted: 2 })).toBeNull();
    expect(multiBlindPoints({ solved: 2, attempted: 5 })).toBeNull();
  });
  it("ranks by points, then time", () => {
    const a = solve({ eventId: "333mbf", multi: { solved: 5, attempted: 5 }, timeMs: 3_000_000 });
    const b = solve({ eventId: "333mbf", multi: { solved: 5, attempted: 6 }, timeMs: 1_000_000 });
    const c = solve({ eventId: "333mbf", multi: { solved: 5, attempted: 5 }, timeMs: 2_000_000 });
    expect([b, a, c].toSorted(compareMultiBlind)).toEqual([c, a, b]);
  });
});

describe("countFmcMoves", () => {
  it("counts outer block turns, not rotations", () => {
    expect(countFmcMoves("R U2 F' x Rw y2")).toBe(4);
    expect(countFmcMoves("R U // comment\nF")).toBe(3);
    expect(countFmcMoves("M2 R")).toBe(3);
    expect(countFmcMoves("R Q")).toBeNull();
  });
});
