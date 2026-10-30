import { describe, expect, it } from "vitest";
import { prDroughts, prProgression, prStreaks, prTimeline } from "./progression";
import type { PersonResult } from "./schemas";

function result(date: string, competitionId: string, roundTypeId: string, best: number, average: number): PersonResult {
  return {
    id: Math.random(),
    pos: 1,
    best,
    average,
    attempts: [],
    regional_single_record: null,
    regional_average_record: null,
    competition_id: competitionId,
    competition_short_name: competitionId,
    competition_start_date: date,
    event_id: "333",
    round_type_id: roundTypeId,
    format_id: "a",
  };
}

describe("prProgression", () => {
  it("records each improvement in order, across rounds and competitions", () => {
    const { single, average } = prProgression([
      // Deliberately out of order: the final is listed before round 1.
      result("2016-03-05", "PDXCubingAlpha2016", "f", 1700, 1900),
      result("2016-03-05", "PDXCubingAlpha2016", "1", 1914, 2157),
      result("2016-06-01", "Later2016", "1", 1800, 1850),
      result("2017-01-01", "Next2017", "1", 1600, 2000),
    ]);
    expect(single.map((p) => [p.competitionId, p.value])).toEqual([
      ["PDXCubingAlpha2016", 1914],
      ["PDXCubingAlpha2016", 1700],
      ["Next2017", 1600],
    ]);
    expect(average.map((p) => [p.competitionId, p.value])).toEqual([
      ["PDXCubingAlpha2016", 2157],
      ["PDXCubingAlpha2016", 1900],
      ["Later2016", 1850],
    ]);
  });

  it("ignores DNF, DNS and missing averages", () => {
    const { single, average } = prProgression([
      result("2020-01-01", "A", "1", -1, 0),
      result("2020-02-01", "B", "1", 900, -1),
    ]);
    expect(single.map((p) => p.value)).toEqual([900]);
    expect(average).toEqual([]);
  });
});

const order = (ids: string[]) => ids.toSorted();
const at = (date: string, competitionId: string, eventId: string, roundTypeId: string, best: number, average: number) => ({
  ...result(date, competitionId, roundTypeId, best, average),
  event_id: eventId,
});

describe("prTimeline", () => {
  it("groups PRs by competition, newest first, with the record each one beat", () => {
    const timeline = prTimeline(
      [
        at("2016-01-01", "A", "333", "f", 2000, 2200),
        at("2016-01-01", "A", "222", "f", 600, 0),
        at("2017-01-01", "B", "333", "f", 1800, 2300),
        at("2018-01-01", "C", "222", "f", 700, 650),
      ],
      order,
    );
    expect(timeline.map((entry) => entry.competitionId)).toEqual(["C", "B", "A"]);
    expect(timeline[0].prs).toEqual([{ eventId: "222", kind: "average", value: 650 }]);
    expect(timeline[1].prs).toEqual([{ eventId: "333", kind: "single", value: 1800, previous: 2000, milestone: "Sub-20" }]);
    expect(timeline[2].prs.map((pr) => `${pr.eventId}-${pr.kind}`)).toEqual(["222-single", "333-single", "333-average"]);
  });

  it("lists a PR improved twice at one competition once, at its best", () => {
    const timeline = prTimeline(
      [
        at("2016-01-01", "A", "333", "f", 2000, 0),
        at("2017-01-01", "B", "333", "1", 1900, 0),
        at("2017-01-01", "B", "333", "f", 1700, 0),
      ],
      order,
    );
    expect(timeline[0].prs).toEqual([{ eventId: "333", kind: "single", value: 1700, previous: 2000, milestone: "Sub-20" }]);
  });
});

describe("prTimeline records", () => {
  it("marks PRs that were also records, keeping the mark from the best result", () => {
    const timeline = prTimeline(
      [
        at("2016-01-01", "A", "333", "f", 2000, 0),
        at("2017-01-01", "B", "333", "1", 1900, 0),
        { ...at("2017-01-01", "B", "333", "f", 1700, 1800), regional_single_record: "NR", regional_average_record: "CR" },
      ],
      order,
    );
    expect(timeline[0].prs).toEqual([
      { eventId: "333", kind: "single", value: 1700, previous: 2000, record: "NR", milestone: "Sub-20" },
      { eventId: "333", kind: "average", value: 1800, record: "CR" },
    ]);
    expect(timeline[1].prs[0].record).toBeUndefined();
  });
});

const streaks = (results: PersonResult[]) => prStreaks(results, prTimeline(results, order));

describe("prStreaks", () => {
  it("finds the current and longest runs of PR competitions", () => {
    const results = [
      at("2016-01-01", "A", "333", "f", 2000, 0), // first result: a PR
      at("2016-02-01", "B", "333", "f", 1900, 0), // PR
      at("2016-03-01", "C", "333", "f", 1800, 0), // PR
      at("2016-04-01", "D", "333", "f", 1850, 0), // no PR
      at("2016-05-01", "E", "333", "f", 1700, 0), // PR
    ];
    const { current, longest } = streaks(results);
    expect(current).toBe(1);
    expect(longest?.length).toBe(3);
    expect([longest?.from.competitionId, longest?.to.competitionId]).toEqual(["A", "C"]);
  });

  it("counts a PR in any event, and keeps the earliest of tied runs", () => {
    const results = [
      at("2016-01-01", "A", "333", "f", 2000, 0),
      at("2016-02-01", "B", "333", "f", 2100, 0),
      at("2016-02-01", "B", "222", "f", 700, 0), // first 2x2 result keeps the run going
      at("2016-03-01", "C", "333", "f", 2200, 0),
      at("2016-03-01", "C", "222", "f", 800, 0),
      at("2016-04-01", "D", "333", "f", 1500, 0),
      at("2016-05-01", "E", "333", "f", 1400, 0),
    ];
    const { current, longest } = streaks(results);
    expect(current).toBe(2);
    expect([longest?.length, longest?.from.competitionId]).toEqual([2, "A"]);
  });

  it("has no streak without results", () => {
    expect(streaks([])).toEqual({ current: 0, longest: null });
  });
});

describe("prTimeline milestones", () => {
  it("marks the barrier a PR broke, against the record it started from", () => {
    const timeline = prTimeline(
      [
        at("2016-01-01", "A", "333", "f", 1100, 0),
        at("2017-01-01", "B", "333", "1", 1050, 0),
        at("2017-01-01", "B", "333", "f", 990, 0),
      ],
      order,
    );
    expect(timeline[0].prs[0].milestone).toBe("Sub-10");
    expect(timeline[1].prs[0].milestone).toBeUndefined();
  });
});

describe("prDroughts", () => {
  it("finds the longest gap between PR competitions and the days since the last", () => {
    const timeline = prTimeline(
      [
        at("2016-01-01", "A", "333", "f", 2000, 0),
        at("2016-03-01", "B", "333", "f", 1900, 0),
        at("2017-03-01", "C", "333", "f", 1950, 0), // no PR
        at("2017-06-01", "D", "333", "f", 1800, 0),
      ],
      order,
    );
    const droughts = prDroughts(timeline, "2017-06-11");
    expect(droughts?.daysSinceLast).toBe(10);
    expect(droughts?.last.competitionId).toBe("D");
    expect([droughts?.longest?.from.competitionId, droughts?.longest?.to.competitionId, droughts?.longest?.days]).toEqual(["B", "D", 457]);
  });

  it("has nothing without PRs, and no gap with only one", () => {
    expect(prDroughts([], "2020-01-01")).toBeNull();
    expect(prDroughts(prTimeline([at("2016-01-01", "A", "333", "f", 2000, 0)], order), "2016-01-01")?.longest).toBeNull();
  });
});
