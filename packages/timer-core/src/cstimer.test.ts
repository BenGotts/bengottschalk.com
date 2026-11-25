import { describe, expect, it } from "vitest";
import { parseCsTimerExport } from "./cstimer";

const file = JSON.stringify({
  session1: [
    [[0, 12345], "R U R' U'", "", 1_700_000_000],
    [[2000, 10000], "F R", "nice", 1_700_000_100],
    [[-1, 9000], "L D", "", 1_700_000_200],
  ],
  session2: [[[0, 60000, 20000], "R2 U2", "", 1_700_000_300]],
  session3: [[[0, 5000], "x", "", 1_700_000_400], "garbage"],
  properties: {
    sessionData: JSON.stringify({
      "1": { name: "Main 3x3", opt: {}, rank: 1 },
      "2": { name: "3BLD", opt: { scrType: "333ni" }, rank: 3 },
      "3": { name: "One handed", opt: { scrType: "333" }, rank: 2 },
    }),
  },
});

describe("parseCsTimerExport", () => {
  const sessions = parseCsTimerExport(file);

  it("reads sessions in csTimer's order with their events", () => {
    expect(sessions.map((s) => [s.name, s.eventId])).toEqual([["Main 3x3", "333"], ["One handed", "333oh"], ["3BLD", "333bf"]]);
  });

  it("reads solves, penalties and timestamps", () => {
    expect(sessions[0].solves).toEqual([
      { timeMs: 12345, penalty: "none", scramble: "R U R' U'", comment: "", startedAt: 1_700_000_000_000, phasesMs: null },
      { timeMs: 10000, penalty: "+2", scramble: "F R", comment: "nice", startedAt: 1_700_000_100_000, phasesMs: null },
      { timeMs: 9000, penalty: "dnf", scramble: "L D", comment: "", startedAt: 1_700_000_200_000, phasesMs: null },
    ]);
  });

  it("turns cumulative phase ends into durations", () => {
    expect(sessions[2].solves[0].phasesMs).toEqual([20000, 40000]);
  });

  it("skips entries it can't read", () => {
    expect(sessions[1].solves).toHaveLength(1);
  });

  it("rejects files that aren't exports", () => {
    expect(() => parseCsTimerExport("nope")).toThrow();
    expect(() => parseCsTimerExport("{}")).toThrow();
  });
});
