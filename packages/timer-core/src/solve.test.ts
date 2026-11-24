import { describe, expect, it } from "vitest";
import { compareMultiBlind, countFmcMoves, multiBlindPoints, rawTimeKnown, solveValue, timingOf, type Solve } from "./solve";

describe("timing method", () => {
  it("uses the recorded method, and works one out for solves saved before it was recorded", () => {
    expect(timingOf({ timing: "touch", entry: "timer", source: "home" })).toBe("touch");
    expect(timingOf({ entry: "timer", source: "home" })).toBe("unknown");
    expect(timingOf({ timing: null, entry: "typed", source: "home" })).toBe("typed");
    expect(timingOf({ entry: "import", source: "home" })).toBe("imported");
    expect(timingOf({ entry: "import", source: "competition" })).toBe("competition");
    expect(timingOf({ entry: "stackmat", source: "home" })).toBe("stackmat");
  });

  it("knows when a solve's own time is unknown (WCA DNFs record none)", () => {
    expect(rawTimeKnown({ source: "competition", penalty: "dnf", timeMs: 0 })).toBe(false);
    expect(rawTimeKnown({ source: "home", penalty: "dnf", timeMs: 12_345 })).toBe(true);
    expect(rawTimeKnown({ source: "competition", penalty: "none", timeMs: 8_070 })).toBe(true);
  });
});

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
