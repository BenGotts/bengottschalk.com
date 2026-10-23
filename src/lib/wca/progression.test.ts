import { describe, expect, it } from "vitest";
import { prProgression } from "./progression";
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
