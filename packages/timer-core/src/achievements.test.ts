import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, barrierId, barrierLabel, earnedIds, evaluateAchievements, type AchievementContext } from "./achievements";
import type { CompetitionAttempt, Solve } from "./solve";
import type { SotdMark } from "./sotd";

const DAY = 86_400_000;
// Noon UTC on 2026-01-01; days are worked out in UTC below.
const T0 = Date.UTC(2026, 0, 1, 12);
let n = 0;

const solve = (overrides: Partial<Solve> = {}): Solve => {
  n += 1;
  return {
    id: `s${n}`, eventId: "333", sessionId: "main-333", timeMs: 15000, penalty: "none", scramble: "", comment: "",
    startedAt: T0 + n, endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: null, entry: "timer", timing: "keyboard",
    createdAt: 0, updatedAt: 0, deletedAt: null, ...overrides,
  };
};

const attempt = (overrides: Partial<CompetitionAttempt> = {}): CompetitionAttempt => ({
  competitionId: "Comp2026", competitionName: "Comp 2026", roundTypeId: "1", attempt: 1, status: "official", timeEstimate: "day",
  roundNumber: 1, position: 10, roundAverage: null, singleRecord: null, averageRecord: null, ...overrides,
});

const utc: Pick<AchievementContext, "dayOf" | "hourOf"> = {
  dayOf: (ms) => new Date(ms).toISOString().slice(0, 10),
  hourOf: (ms) => new Date(ms).getUTCHours(),
};

const earned = (solves: Solve[], extra: Partial<AchievementContext> = {}) => earnedIds(evaluateAchievements({ solves, ...utc, ...extra }));

describe("the list", () => {
  it("has unique ids", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it("labels barriers the way cubers say them", () => {
    expect(barrierLabel("333", 20)).toBe("Sub-20");
    expect(barrierLabel("333bf", 120)).toBe("Sub-2:00");
    expect(barrierLabel("444", 90)).toBe("Sub-1:30");
    expect(barrierLabel("555bf", 3600)).toBe("Sub-60:00");
    expect(barrierLabel("333mbf", 5)).toBe("5 points");
  });
});

describe("practice", () => {
  it("counts solves and records progress", () => {
    const solves = Array.from({ length: 120 }, () => solve());
    const report = evaluateAchievements({ solves, ...utc });
    expect(report.statuses.get("solves:1")?.earnedAt).toBe(solves[0].startedAt);
    expect(report.statuses.get("solves:100")?.earnedAt).toBe(solves[99].startedAt);
    expect(report.statuses.get("solves:500")).toEqual({ earnedAt: null, progress: { current: 120, target: 500 } });
    expect(report.statuses.get("day:50")?.earnedAt).toBe(solves[49].startedAt);
  });
  it("leaves out deleted solves", () => {
    expect(earned([solve({ deletedAt: 1 })]).has("solves:1")).toBe(false);
  });
});

describe("streaks", () => {
  it("counts days in a row, and the current streak", () => {
    const solves = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10].map((d) => solve({ startedAt: T0 + d * DAY }));
    const report = evaluateAchievements({ solves, ...utc, now: T0 + 11 * DAY });
    expect(report.bestStreak).toBe(7);
    expect(report.currentStreak).toBe(7);
    expect(report.statuses.get("streak:3")?.earnedAt).toBe(T0 + 2 * DAY);
    expect(report.statuses.get("streak:7")?.earnedAt).toBe(T0 + 10 * DAY);
    expect(evaluateAchievements({ solves, ...utc, now: T0 + 13 * DAY }).currentStreak).toBe(0);
  });
});

describe("barriers", () => {
  it("earns singles under each threshold", () => {
    const ids = earned([solve({ timeMs: 19990 })]);
    expect(ids.has(barrierId("333", "single", 20))).toBe(true);
    expect(ids.has(barrierId("333", "single", 30))).toBe(true);
    expect(ids.has(barrierId("333", "single", 15))).toBe(false);
  });
  it("needs strictly under: 20.00 isn't sub-20, and a +2 counts", () => {
    expect(earned([solve({ timeMs: 20000 })]).has(barrierId("333", "single", 20))).toBe(false);
    expect(earned([solve({ timeMs: 18500, penalty: "+2" })]).has(barrierId("333", "single", 20))).toBe(false);
  });
  it("ignores typed times for timed events", () => {
    expect(earned([solve({ timeMs: 5000, entry: "typed", timing: "typed" })]).has(barrierId("333", "single", 8))).toBe(false);
  });
  it("earns averages within one session only", () => {
    const a = [1, 2].map(() => solve({ timeMs: 14000, sessionId: "a" }));
    const b = [1, 2, 3].map(() => solve({ timeMs: 14000, sessionId: "b" }));
    expect(earned([...a, ...b]).has(barrierId("333", "average", 15))).toBe(false);
    const c = [1, 2, 3, 4, 5].map(() => solve({ timeMs: 14000, sessionId: "c" }));
    expect(earned(c).has(barrierId("333", "average", 15))).toBe(true);
  });
  it("uses moves for FMC and points for Multi-Blind", () => {
    const ids = earned([
      solve({ eventId: "333fm", fmc: { solution: "", moves: 29 }, entry: "typed", timing: "typed" }),
      solve({ eventId: "333mbf", multi: { solved: 6, attempted: 7 }, timeMs: 3_000_000 }),
    ]);
    expect(ids.has(barrierId("333fm", "single", 30))).toBe(true);
    expect(ids.has(barrierId("333fm", "single", 25))).toBe(false);
    expect(ids.has(barrierId("333mbf", "single", 5))).toBe(true);
    expect(ids.has(barrierId("333mbf", "single", 10))).toBe(false);
  });
  it("earns competition barriers from competition attempts", () => {
    const comp = [1, 2, 3, 4, 5].map((i) => solve({ timeMs: 11000, source: "competition", timing: "competition", competition: attempt({ attempt: i }) }));
    const ids = earned(comp);
    expect(ids.has(barrierId("333", "competition-single", 12))).toBe(true);
    expect(ids.has(barrierId("333", "competition-average", 12))).toBe(true);
    expect(earned([solve({ timeMs: 11000 })]).has(barrierId("333", "competition-single", 12))).toBe(false);
  });
});

describe("personal bests and secrets", () => {
  it("counts each new best single after the first", () => {
    const ids = earned([solve({ timeMs: 15000 }), solve({ timeMs: 16000 }), solve({ timeMs: 14000 })]);
    expect(ids.has("pbs:1")).toBe(true);
    expect(ids.has("pbs:10")).toBe(false);
  });
  it("finds a photo finish and a +2 that would have been a PB", () => {
    const ids = earned([solve({ timeMs: 12345 }), solve({ timeMs: 12335 }), solve({ timeMs: 12000, penalty: "+2" })]);
    expect(ids.has("secret:photo-finish")).toBe(true);
    expect(ids.has("secret:so-close")).toBe(true);
  });
  it("finds sevens and palindromes", () => {
    expect(earned([solve({ timeMs: 7779 })]).has("secret:sevens")).toBe(true);
    expect(earned([solve({ timeMs: 12210 })]).has("secret:palindrome")).toBe(true);
    expect(earned([solve({ timeMs: 4540 })]).has("secret:palindrome")).toBe(false);
  });
  it("finds night owls", () => {
    expect(earned([solve({ startedAt: Date.UTC(2026, 0, 2, 3) })]).has("secret:night-owl")).toBe(true);
  });
});

describe("blindfolded", () => {
  it("counts successes in a row, reset by a DNF", () => {
    const bf = (penalty: Solve["penalty"]) => solve({ eventId: "333bf", timeMs: 60000, penalty });
    const ids = earned([bf("none"), bf("none"), bf("dnf"), bf("none"), bf("none"), bf("none")]);
    expect(ids.has("bld-first:333bf")).toBe(true);
    expect(ids.has("bld-run:3")).toBe(true);
    expect(ids.has("bld-run:5")).toBe(false);
  });
});

describe("consistency", () => {
  it("finds five within 10%", () => {
    const ids = earned([15000, 15500, 16000, 15200, 16400].map((timeMs) => solve({ timeMs })));
    expect(ids.has("steady:5")).toBe(true);
    expect(earned([15000, 15500, 17000, 15200, 16400].map((timeMs) => solve({ timeMs }))).has("steady:5")).toBe(false);
  });
});

describe("competition", () => {
  it("counts competitions, finals, podiums and records", () => {
    const ids = earned([
      solve({ source: "competition", competition: attempt({ competitionId: "A" }) }),
      solve({ source: "competition", competition: attempt({ competitionId: "B", roundTypeId: "c", position: 2 }) }),
      solve({ source: "competition", competition: attempt({ competitionId: "C", singleRecord: "NR" }) }),
    ]);
    expect(ids.has("comps:1")).toBe(true);
    expect(ids.has("comps:5")).toBe(false);
    expect(ids.has("comp:final")).toBe(true);
    expect(ids.has("comp:podium")).toBe(true);
    expect(ids.has("comp:win")).toBe(false);
    expect(ids.has("comp:record")).toBe(true);
  });
  it("counts competition PRs only between competition attempts", () => {
    const ids = earned([
      solve({ timeMs: 9000 }),
      solve({ timeMs: 12000, source: "competition", competition: attempt() }),
      solve({ timeMs: 11000, source: "competition", competition: attempt({ attempt: 2 }) }),
    ]);
    expect(ids.has("comp-pbs:1")).toBe(true);
  });
});

describe("Solve of the Day", () => {
  it("counts days in a row with a mark", () => {
    const mark = (d: number): SotdMark => ({ eventId: "333", date: new Date(T0 + d * DAY).toISOString().slice(0, 10), solveId: `m${d}`, updatedAt: T0 + d * DAY, deletedAt: null });
    const ids = earned([], { marks: [0, 1, 2, 3, 4, 5, 6].map(mark) });
    expect(ids.has("sotd:7")).toBe(true);
    expect(ids.has("sotd:30")).toBe(false);
  });
});
