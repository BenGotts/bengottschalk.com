import { describe, expect, it } from "vitest";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { sessionSummary } from "@bengottschalk/timer-core/summary";
import { sessionClipboardText } from "./sessionText";

const solve = (timeMs: number, changes: Partial<Solve> = {}): Solve => ({
  id: `s${timeMs}`, eventId: "333", sessionId: "t1", timeMs, penalty: "none", scramble: "R U R' U'", comment: "",
  startedAt: Date.UTC(2026, 10, 24, 18), endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: null,
  entry: "timer", createdAt: 0, updatedAt: 0, deletedAt: null, ...changes,
});

describe("sessionClipboardText", () => {
  it("lays a session out like csTimer's export", () => {
    const solves = [solve(10000), solve(12000, { comment: "lockup" }), solve(9000, { penalty: "dnf" }), solve(9000), solve(11000)];
    const text = sessionClipboardText({
      name: "Morning ao5",
      eventId: "333",
      summary: sessionSummary(solves.map(solveValue)),
      solves,
      precision: "hundredths",
      generatedAt: new Date(2026, 10, 24, 12).getTime(),
    });
    expect(text).toBe([
      "Generated on 2026-11-24",
      "Morning ao5 · 3x3x3 Cube",
      "Solves/Total: 4/5",
      "",
      "ao5: 11.00",
      "Mean: 10.50 (σ = 1.12)",
      "Best: 9.00",
      "Worst: 12.00",
      "mo3: best DNF · worst DNF",
      "",
      "Time List:",
      "1. 10.00   R U R' U'",
      "2. 12.00[lockup]   R U R' U'",
      "3. DNF   R U R' U'",
      "4. 9.00   R U R' U'",
      "5. 11.00   R U R' U'",
    ].join("\n"));
  });
});
