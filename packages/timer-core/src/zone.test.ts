import { describe, expect, it } from "vitest";
import { addDays, endOfDay, isTimeZone, localDate, parseInstant, zonedTime } from "./zone";
import { liveCompetitionInfo, liveSolves, officialSolves, withEnteredAt, type WcaLiveCapture } from "./competition";

const PACIFIC = "America/Los_Angeles";

describe("time zones", () => {
  it("reads WCA times as UTC and never as local time", () => {
    expect(parseInstant("2026-11-21T18:45:40Z")).toBe(Date.UTC(2026, 10, 21, 18, 45, 40));
    expect(parseInstant("2026-11-21T10:45:40-08:00")).toBe(Date.UTC(2026, 10, 21, 18, 45, 40));
    // No offset: refused, rather than read in whatever zone the server runs in.
    expect(parseInstant("2026-11-21T18:45:40")).toBeNull();
    expect(parseInstant("not a time")).toBeNull();
  });

  it("puts a moment on the person's own calendar day", () => {
    const evening = Date.parse("2026-11-22T03:30:00Z"); // 7:30pm on the 21st in Oregon
    expect(localDate(evening, PACIFIC)).toBe("2026-11-21");
    expect(localDate(evening, "UTC")).toBe("2026-11-22");
    expect(localDate(evening, "Asia/Tokyo")).toBe("2026-11-22");
  });

  it("does calendar arithmetic and day boundaries in a zone", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(new Date(endOfDay("2026-11-21", PACIFIC)).toISOString()).toBe("2026-11-22T08:00:00.000Z");
    expect(new Date(zonedTime("2026-11-21", 12, PACIFIC)).toISOString()).toBe("2026-11-21T20:00:00.000Z");
    expect(isTimeZone(PACIFIC)).toBe(true);
    expect(isTimeZone("Mars/Olympus_Mons")).toBe(false);
    expect(isTimeZone(undefined)).toBe(false);
  });
});

// UO Fall 2026, as captured from WCA Live (times in UTC).
const t = (iso: string) => Date.parse(iso);
const capture: WcaLiveCapture = {
  schedule: {
    liveId: "11761", name: "UO Fall 2026", startDate: "2026-11-21", endDate: "2026-11-21", timeZone: PACIFIC,
    start: t("2026-11-21T16:00:00Z"), end: t("2026-11-22T00:20:00Z"),
    roundCounts: { "444": 2, "333": 3 },
    activities: [
      { code: "444-r1", start: t("2026-11-21T17:45:00Z"), end: t("2026-11-21T18:45:00Z") },
      { code: "444-r1-g3", start: t("2026-11-21T18:25:00Z"), end: t("2026-11-21T18:45:00Z") },
      { code: "333-r1", start: t("2026-11-21T16:45:00Z"), end: t("2026-11-21T17:45:00Z") },
    ],
  },
  assignments: { "2016GOTT01": [{ code: "444-r1-g3", start: t("2026-11-21T18:25:00Z"), end: t("2026-11-21T18:45:00Z") }] },
  enteredAt: { "2016GOTT01": { "444-r1": t("2026-11-21T18:41:00Z") } },
};

const official = (event_id: string, round_type_id: string, attempts: number[]) => ({
  competition_id: "UOFall2026", competition_short_name: "UO Fall 2026", competition_start_date: "2026-11-21",
  event_id, round_type_id, pos: 1, best: 0, average: 0, attempts, regional_single_record: null, regional_average_record: null,
});

describe("placing attempts from WCA Live", () => {
  it("spreads attempts through the group, ending when the result was entered", () => {
    const info = liveCompetitionInfo(capture, "2016GOTT01");
    const solves = officialSolves([official("444", "1", [3387, 3182, 3321, 3280, 3764])], info, 0);
    expect(solves.map((s) => s.competition?.timeEstimate)).toEqual(Array(5).fill("entered"));
    const times = solves.map((s) => s.startedAt);
    expect(Math.min(...times)).toBeGreaterThan(t("2026-11-21T18:25:00Z"));
    expect(Math.max(...times)).toBeLessThan(t("2026-11-21T18:41:00Z"));
    // On the person's calendar it's the 21st, at 10:25–10:41am.
    expect(localDate(times[0], PACIFIC)).toBe("2026-11-21");
  });

  it("uses the group alone when the entry time is far after it, and the round when there's no group", () => {
    const late: WcaLiveCapture = { ...capture, enteredAt: { "2016GOTT01": { "444-r1": t("2026-11-21T22:00:00Z") } } };
    expect(officialSolves([official("444", "1", [3000, 3000, 3000, 3000, 3000])], liveCompetitionInfo(late, "2016GOTT01"), 0)[0].competition?.timeEstimate).toBe("group");
    const solves = officialSolves([official("333", "1", [800, 800, 800, 800, 800])], liveCompetitionInfo(capture, "2016GOTT01"), 0);
    expect(solves[0].competition?.timeEstimate).toBe("round");
    expect(solves[0].startedAt).toBeGreaterThan(t("2026-11-21T16:45:00Z"));
  });

  it("falls back to midday in the venue's zone, or the person's, for a day estimate", () => {
    const bare: WcaLiveCapture = { ...capture, schedule: { ...capture.schedule, activities: [], timeZone: null }, assignments: {}, enteredAt: {} };
    const solve = officialSolves([official("333", "1", [800, 800, 800, 800, 800])], liveCompetitionInfo(bare, "2016GOTT01", PACIFIC), 0)[0];
    expect(solve.competition?.timeEstimate).toBe("day");
    expect(localDate(solve.startedAt, PACIFIC)).toBe("2026-11-21");
    expect(new Date(solve.startedAt).getUTCHours()).toBeGreaterThanOrEqual(20); // noon Pacific or later
  });

  it("takes fresh entry times from WCA Live results for live attempts", () => {
    const fresh = withEnteredAt({ ...capture, enteredAt: {} }, "2016GOTT01", [{
      enteredAt: "2026-11-21T18:43:00Z", ranking: 3, average: 3300, singleRecordTag: null, averageRecordTag: null,
      attempts: [3387, 3182, 3321, 3280, 3764].map((result) => ({ result })),
      round: { number: 1, name: "First Round", competitionEvent: { event: { id: "444" } }, format: { numberOfAttempts: 5 } },
    }]);
    expect(fresh.enteredAt["2016GOTT01"]["444-r1"]).toBe(t("2026-11-21T18:43:00Z"));
    const live = liveSolves("UOFall2026", [{
      ranking: 3, average: 3300, singleRecordTag: null, averageRecordTag: null, attempts: [{ result: 3387 }],
      round: { number: 1, name: "First Round", competitionEvent: { event: { id: "444" } }, format: { numberOfAttempts: 5 } },
    }], liveCompetitionInfo(fresh, "2016GOTT01"), 0);
    expect(live[0].competition?.timeEstimate).toBe("entered");
  });
});
