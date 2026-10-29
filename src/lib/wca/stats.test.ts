import { describe, expect, it } from "vitest";
import { highlightEvents, podiums, podiumStats } from "./stats";
import type { PersonResult } from "./schemas";

function result(date: string, roundTypeId: string, pos: number, best: number): PersonResult {
  return {
    id: Math.random(),
    pos,
    best,
    average: best,
    attempts: [],
    regional_single_record: null,
    regional_average_record: null,
    competition_id: `Comp${date}`,
    competition_short_name: `Comp ${date}`,
    competition_start_date: date,
    event_id: "333",
    round_type_id: roundTypeId,
    format_id: "a",
  };
}

describe("podiums", () => {
  it("keeps top-three finishes in finals, newest first", () => {
    const found = podiums([
      result("2018-01-01", "f", 2, 1500),
      result("2019-01-01", "c", 1, 1400),
      result("2020-01-01", "f", 3, 1300),
    ]);
    expect(found.map((p) => [p.result.competition_start_date, p.medal])).toEqual([
      ["2020-01-01", "bronze"],
      ["2019-01-01", "gold"],
      ["2018-01-01", "silver"],
    ]);
  });

  it("ignores earlier rounds, fourth place and finishes without a result", () => {
    expect(
      podiums([
        result("2018-01-01", "1", 1, 1500),
        result("2018-01-01", "f", 4, 1500),
        result("2018-01-01", "f", 1, -1),
      ]),
    ).toEqual([]);
  });
});

const rank = (worldRank: number) => ({ best: 100, world_rank: worldRank, continent_rank: 1, country_rank: 1 });

describe("highlightEvents", () => {
  it("puts 3x3 first, then the best world-ranked singles", () => {
    const records = { "222": { single: rank(900) }, "333": { single: rank(5000) }, pyram: { single: rank(300) }, skewb: { single: rank(600) } };
    expect(highlightEvents(records, 3)).toEqual(["333", "pyram", "skewb"]);
  });

  it("leaves out retired events", () => {
    expect(highlightEvents({ "333ft": { single: rank(10) }, pyram: { single: rank(300) } }, 4)).toEqual(["pyram"]);
  });

  it("works without a 3x3 result", () => {
    expect(highlightEvents({ "222": { single: rank(900) }, pyram: { single: rank(300) } }, 4)).toEqual(["pyram", "222"]);
  });
});

const at = (date: string, eventId: string, roundTypeId: string, pos: number): PersonResult => ({
  ...result(date, roundTypeId, pos, 1000),
  event_id: eventId,
});

describe("podiumStats", () => {
  it("counts podiums and where they came from", () => {
    const stats = podiumStats([
      at("2019-01-01", "333", "f", 2),
      at("2019-01-01", "222", "f", 1),
      at("2020-06-01", "333", "f", 5),
      at("2021-03-01", "333", "f", 1),
      at("2021-03-01", "333", "1", 1), // not a final
      at("2022-02-01", "pyram", "c", 3),
    ]);
    expect(stats.podiums).toBe(4);
    expect(stats.events).toBe(3);
    expect(stats.topEvent).toEqual({ eventId: "333", count: 2 });
    expect(stats.bestCompetition).toMatchObject({ id: "Comp2019-01-01", count: 2 });
    expect(stats.bestYear).toEqual({ year: "2019", count: 2, events: 2 });
    expect(stats.firstPodium?.result.competition_start_date).toBe("2019-01-01");
    // 2022 and 2021 had podiums; 2020 didn't.
    expect(stats.currentStreak).toBe(2);
  });

  it("handles no podiums", () => {
    const stats = podiumStats([at("2020-01-01", "333", "f", 4)]);
    expect(stats).toMatchObject({ podiums: 0, topEvent: null, bestCompetition: null, firstPodium: null, currentStreak: 0 });
  });
});
