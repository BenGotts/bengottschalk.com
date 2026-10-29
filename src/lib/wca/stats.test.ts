import { describe, expect, it } from "vitest";
import { highlightEvents, podiums } from "./stats";
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
