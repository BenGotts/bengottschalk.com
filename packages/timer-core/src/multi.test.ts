import { describe, expect, it } from "vitest";
import { multiBlindResultPoints, multiBlindStats, multiBlindTimeMs, rawMultiBlindPoints } from "./multi";
import type { Solve } from "./solve";

const attempt = (solved: number, attempted: number, timeMs: number, overrides: Partial<Solve> = {}): Solve => ({
  id: `${solved}-${attempted}-${timeMs}`, eventId: "333mbf", sessionId: "main-333mbf", timeMs, penalty: "none", scramble: "", comment: "",
  startedAt: 0, endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: { solved, attempted }, entry: "timer",
  createdAt: 0, updatedAt: 0, deletedAt: null, ...overrides,
});

describe("Multi-Blind points", () => {
  it("scores solved minus missed", () => {
    expect(multiBlindResultPoints(attempt(6, 7, 1))).toBe(5);
    expect(multiBlindResultPoints(attempt(2, 2, 1))).toBe(2);
    expect(multiBlindResultPoints(attempt(2, 4, 1))).toBe(0);
  });

  it("is a DNF with fewer than 2 solved, below 0 points, a DNF penalty or no cubes", () => {
    expect(multiBlindResultPoints(attempt(1, 1, 1))).toBeNull();
    expect(multiBlindResultPoints(attempt(2, 5, 1))).toBeNull();
    expect(multiBlindResultPoints(attempt(7, 7, 1, { penalty: "dnf" }))).toBeNull();
    expect(multiBlindResultPoints(attempt(0, 0, 1, { multi: null }))).toBeNull();
    // The raw points still say what happened.
    expect(rawMultiBlindPoints(attempt(2, 5, 1))).toBe(-1);
  });

  it("knows when the time is known, with any +2", () => {
    expect(multiBlindTimeMs({ timeMs: 0, penalty: "none" })).toBeNull();
    expect(multiBlindTimeMs({ timeMs: 60_000, penalty: "+2" })).toBe(62_000);
  });
});

describe("multiBlindStats", () => {
  it("ranks by points, then time, then fewer missed", () => {
    const solves = [
      attempt(5, 5, 3_000_000), // 5 points
      attempt(6, 7, 3_300_000), // 5 points, slower
      attempt(1, 2, 100_000), // DNF
      attempt(5, 5, 2_900_000), // 5 points, fastest
      attempt(9, 13, 3_500_000), // 5 points, slowest
    ];
    const stats = multiBlindStats(solves);
    expect(stats.bestIndex).toBe(3);
    expect(stats.attempts).toBe(5);
    expect(stats.successes).toBe(4);
    expect(stats.meanPoints).toBe(5);
    expect(stats.cubesSolved).toBe(26);
    expect(stats.cubesAttempted).toBe(32);

    expect(multiBlindStats([attempt(3, 3, 1_000), attempt(4, 4, 3_600_000)]).bestIndex).toBe(1);
    // Same points and time: fewer missed wins; then the earlier one.
    expect(multiBlindStats([attempt(4, 5, 1_000), attempt(3, 3, 1_000), attempt(3, 3, 1_000)]).bestIndex).toBe(1);
  });

  it("has no best without a success", () => {
    expect(multiBlindStats([attempt(1, 3, 1)])).toMatchObject({ bestIndex: null, meanPoints: null, successes: 0, attempts: 1 });
    expect(multiBlindStats([])).toMatchObject({ bestIndex: null, attempts: 0 });
  });
});
