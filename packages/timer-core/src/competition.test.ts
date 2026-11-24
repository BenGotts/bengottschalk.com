import { describe, expect, it } from "vitest";
import { encodeMultiResult } from "@wca/helpers";
import {
  attemptValue, competitionInfo, competitionSolveChanged, formatRoundAverage, groupByCompetition, liveSolves, normalizedRoundType,
  officialSolves, ordinal, roundName, roundNumberFor, schedulePlacer, zonedTime, type WcaLiveResult, type WcaPersonResult, type WcifForPlacement,
} from "./competition";
import { solveValue } from "./solve";
import { sotdClipboardText } from "./sotd";
import results from "./fixtures/results-2016GOTT01.json";
import uoWcif from "./fixtures/wcif-uofall2026.json";

// Real data, trimmed: UO Fall 2026 (with a full schedule) and Eugene 3x3 Mania 2017 (no schedule).
const RESULTS = results as WcaPersonResult[];
const WCIF = uoWcif as WcifForPlacement;
const WCA_ID = "2016GOTT01";
const NOW = 1_800_000_000_000;
const byComp = groupByCompetition(RESULTS);

describe("attemptValue", () => {
  it("reads times, DNFs and skips attempts not made", () => {
    expect(attemptValue("333", 761)).toEqual({ timeMs: 7610, penalty: "none", fmc: null, multi: null });
    expect(attemptValue("333", -1)).toMatchObject({ penalty: "dnf" });
    expect(attemptValue("333", 0)).toBeNull();
    expect(attemptValue("333", -2)).toBeNull();
  });
  it("reads FMC move counts", () => {
    expect(attemptValue("333fm", 47)).toEqual({ timeMs: 0, penalty: "none", fmc: { solution: "", moves: 47 }, multi: null });
    expect(attemptValue("333fm", -1)).toMatchObject({ penalty: "dnf", fmc: null });
  });
  it("decodes Multi-Blind", () => {
    const value = encodeMultiResult({ solved: 9, attempted: 10, centiseconds: 345_600 });
    expect(attemptValue("333mbf", value)).toEqual({ timeMs: 3_456_000, penalty: "none", fmc: null, multi: { solved: 9, attempted: 10 } });
    expect(attemptValue("333mbf", -1)).toMatchObject({ penalty: "dnf", multi: null });
  });
});

describe("round types", () => {
  it("treats combined rounds as their plain round", () => {
    expect(["c", "d", "e", "g", "f", "1"].map(normalizedRoundType)).toEqual(["f", "1", "2", "3", "f", "1"]);
    expect(roundName("c")).toBe("Final");
    expect(roundName("d")).toBe("First round");
  });
  it("numbers rounds, with finals as the last", () => {
    expect(roundNumberFor("f", 3)).toBe(3);
    expect(roundNumberFor("c", 2)).toBe(2);
    expect(roundNumberFor("f", null)).toBeNull();
    expect(roundNumberFor("2", 3)).toBe(2);
    expect(roundNumberFor("d", 2)).toBe(1);
  });
});

describe("zonedTime", () => {
  it("turns a local time in a zone into a moment", () => {
    // Noon in Los Angeles in November is 20:00 UTC (PST), in July 19:00 UTC (PDT).
    expect(new Date(zonedTime("2026-11-21", 12, "America/Los_Angeles")).toISOString()).toBe("2026-11-21T20:00:00.000Z");
    expect(new Date(zonedTime("2026-07-04", 12, "America/Los_Angeles")).toISOString()).toBe("2026-07-04T19:00:00.000Z");
    expect(new Date(zonedTime("2026-11-21", 12, "Asia/Tokyo")).toISOString()).toBe("2026-11-21T03:00:00.000Z");
    expect(new Date(zonedTime("2026-11-21", 12, null)).toISOString()).toBe("2026-11-21T12:00:00.000Z");
  });
});

describe("schedulePlacer", () => {
  const place = schedulePlacer(WCIF, WCA_ID);

  it("spreads attempts through the competitor's group", () => {
    // 333-r1-g4 ran 17:30–17:45 UTC: five attempts, one in the middle of each three minutes.
    const placement = place("333", 1, 5)!;
    expect(placement.estimate).toBe("group");
    expect(placement.times.map((t) => new Date(t).toISOString().slice(11, 19))).toEqual(["17:31:30", "17:34:30", "17:37:30", "17:40:30", "17:43:30"]);
  });

  it("falls back to the round's slot without an assignment", () => {
    const placement = schedulePlacer(WCIF, "2099NOBO01")("333", 1, 5)!;
    expect(placement.estimate).toBe("round");
    expect(new Date(placement.times[0]).toISOString() < new Date(placement.times[4]).toISOString()).toBe(true);
  });

  it("gives null for rounds the schedule doesn't have", () => {
    expect(place("666", 1, 3)).toBeNull();
    expect(place("333", null, 5)).toBeNull();
  });

  it("uses each attempt's own slot for FMC and Multi-Blind", () => {
    const wcif: WcifForPlacement = {
      id: "X", name: "X", persons: [],
      schedule: { startDate: "2026-01-01", venues: [{ timezone: "UTC", rooms: [{ activities: [{
        id: 1, activityCode: "333fm-r1", startTime: "2026-01-01T09:00:00Z", endTime: "2026-01-01T13:00:00Z",
        childActivities: [1, 2, 3].map((a) => ({ id: 10 + a, activityCode: `333fm-r1-a${a}`, startTime: `2026-01-01T${String(7 + 2 * a).padStart(2, "0")}:00:00Z`, endTime: `2026-01-01T${String(8 + 2 * a).padStart(2, "0")}:00:00Z`, childActivities: [] })),
      }] }] }] },
    };
    const placement = schedulePlacer(wcif, WCA_ID)("333fm", 1, 3)!;
    expect(placement.times.map((t) => new Date(t).toISOString().slice(11, 16))).toEqual(["09:30", "11:30", "13:30"]);
  });
});

describe("officialSolves", () => {
  const uo = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW);
  const eugene = officialSolves(byComp.get("Eugene3x3Mania2017")!, competitionInfo(null, WCA_ID, { name: "Eugene 3x3 Mania 2017", startDate: "2017-04-08" }), NOW);

  it("makes a main-session solve per attempt made, with fixed ids", () => {
    const final = uo.filter((s) => s.eventId === "333" && s.competition?.roundTypeId === "f");
    expect(final.map((s) => s.timeMs)).toEqual([8070, 10370, 7780, 8670, 11540]);
    expect(final[0]).toMatchObject({
      id: "wca-UOFall2026-333-f-1",
      sessionId: "main-333",
      source: "competition",
      entry: "import",
      competition: { competitionName: "UO Fall 2026", attempt: 1, status: "official", timeEstimate: "group", roundNumber: 3, position: 3, roundAverage: 904 },
    });
  });

  it("puts each round in its group's slot, in order", () => {
    const r1 = uo.filter((s) => s.eventId === "333" && s.competition?.roundTypeId === "1");
    const final = uo.filter((s) => s.eventId === "333" && s.competition?.roundTypeId === "f");
    expect(new Date(r1[0].startedAt).toISOString()).toBe("2026-11-21T17:31:30.000Z");
    expect(new Date(final[0].startedAt).toISOString()).toBe("2026-11-21T23:36:30.000Z");
  });

  it("uses the plain round type in ids for combined rounds", () => {
    const fourByFour = uo.filter((s) => s.eventId === "444");
    expect(fourByFour.map((s) => s.id)).toContain("wca-UOFall2026-444-1-1");
    expect(fourByFour.find((s) => s.id === "wca-UOFall2026-444-1-1")!.competition!.roundTypeId).toBe("d");
  });

  it("falls back to midday on the first day without a schedule, keeping order", () => {
    const threes = eugene.filter((s) => s.eventId === "333");
    expect(threes.every((s) => s.competition!.timeEstimate === "day")).toBe(true);
    expect(new Date(threes[0].startedAt).toISOString().slice(0, 10)).toBe("2017-04-08");
    const times = threes.map((s) => s.startedAt);
    expect(times).toEqual(times.toSorted((a, b) => a - b));
  });

  it("skips attempts not made, retired events and keeps FMC moves", () => {
    expect(eugene.some((s) => s.eventId === "333ft")).toBe(false);
    expect(eugene.filter((s) => s.eventId === "333mbf")).toHaveLength(1);
    const fmc = eugene.filter((s) => s.eventId === "333fm");
    expect(fmc.map((s) => solveValue(s))).toEqual([Infinity, 56, 47]);
  });

  it("only flags real changes", () => {
    const again = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW + 1000);
    expect(uo.every((s, i) => !competitionSolveChanged(s, again[i]))).toBe(true);
    expect(competitionSolveChanged(uo[0], { ...again[0], penalty: "dnf" })).toBe(true);
  });
});

describe("liveSolves", () => {
  const live: WcaLiveResult[] = [
    { ranking: 2, average: 905, singleRecordTag: "PR", averageRecordTag: null, attempts: [807, 1037, 778].map((result) => ({ result })), round: { number: 3, name: "Final", competitionEvent: { event: { id: "333" } }, format: { numberOfAttempts: 5 } } },
    { ranking: 4, average: null, singleRecordTag: null, averageRecordTag: null, attempts: [3387, 3182].map((result) => ({ result })), round: { number: 1, name: "Round 1", competitionEvent: { event: { id: "444" } }, format: { numberOfAttempts: 5 } } },
  ];
  const info = competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" });
  const solves = liveSolves("UOFall2026", live, info, NOW);

  it("makes the same ids official results will, so official replaces live", () => {
    expect(solves.map((s) => s.id)).toEqual([
      "wca-UOFall2026-333-f-1", "wca-UOFall2026-333-f-2", "wca-UOFall2026-333-f-3",
      "wca-UOFall2026-444-1-1", "wca-UOFall2026-444-1-2",
    ]);
    const official = officialSolves(byComp.get("UOFall2026")!, info, NOW);
    const officialIds = new Set(official.map((s) => s.id));
    expect(solves.every((s) => officialIds.has(s.id))).toBe(true);
    expect(solves[0].competition!.status).toBe("live");
  });

  it("places live attempts where the official ones will go, even mid-round", () => {
    const official = new Map(officialSolves(byComp.get("UOFall2026")!, info, NOW).map((s) => [s.id, s.startedAt]));
    expect(solves.every((s) => official.get(s.id) === s.startedAt)).toBe(true);
    expect(new Date(solves[0].startedAt).toISOString()).toBe("2026-11-21T23:36:30.000Z");
  });
});

describe("Solve of the Day text for a competition attempt", () => {
  it("names the competition, round, attempt, placing, average and records", () => {
    const [solve] = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW)
      .filter((s) => s.eventId === "333" && s.competition?.roundTypeId === "f");
    const text = sotdClipboardText({ solve: { ...solve, competition: { ...solve.competition!, singleRecord: "NR" } }, ao5: null, ao12: null, wasPersonalBest: false, sessionName: "3x3x3 Cube · Main" }, "hundredths");
    expect(text).toContain("Competition: UO Fall 2026 (UOFall2026)");
    expect(text).toContain("Round: Final, attempt 1");
    expect(text).toContain("Placed: 3rd");
    expect(text).toContain("Round average: 9.04");
    expect(text).toContain("Records: NR single");
    expect(text).toContain("Time: 8.07");
    expect(text).not.toContain("Session:");
  });

  it("follows the precision setting, like every other time", () => {
    const [solve] = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW)
      .filter((s) => s.eventId === "333" && s.competition?.roundTypeId === "f");
    const text = sotdClipboardText({ solve, ao5: null, ao12: null, wasPersonalBest: false, sessionName: "" }, "thousandths");
    expect(text).toContain("Time: 8.070");
    expect(text).toContain("Round average: 9.040");
  });

  it("gives no made-up time for a WCA DNF, which has none", () => {
    const dnf = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW)
      .find((s) => s.penalty === "dnf")!;
    expect(dnf).toBeDefined();
    const text = sotdClipboardText({ solve: dnf, ao5: null, ao12: null, wasPersonalBest: false, sessionName: "" }, "hundredths");
    expect(text).toContain("Time: DNF");
    expect(text).not.toContain("DNF (");
  });

  it("records competition attempts as timed by the judges", () => {
    const solves = officialSolves(byComp.get("UOFall2026")!, competitionInfo(WCIF, WCA_ID, { name: "UO Fall 2026", startDate: "2026-11-21" }), NOW);
    expect(solves.every((s) => s.timing === "competition")).toBe(true);
  });
});

describe("formatting", () => {
  it("formats round averages and places", () => {
    expect(formatRoundAverage("333", 904)).toBe("9.04");
    expect(formatRoundAverage("333fm", 5150)).toBe("51.50");
    expect(formatRoundAverage("333", -1)).toBe("DNF");
    expect(formatRoundAverage("333", 0)).toBeNull();
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "101st"]);
  });
});
