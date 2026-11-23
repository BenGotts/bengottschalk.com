import { describe, expect, it } from "vitest";
import { CURRENT_EVENT_IDS } from "./events";
import { podiumGoal } from "./podiumGoal";
import { podiums } from "./stats";
import type { PersonResult } from "./schemas";

function final(eventId: string, date: string, pos: number): PersonResult {
  return {
    id: Math.random(),
    pos,
    best: 1000,
    average: 1100,
    attempts: [],
    regional_single_record: null,
    regional_average_record: null,
    competition_id: `Comp${date}`,
    competition_short_name: `Comp ${date}`,
    competition_start_date: date,
    event_id: eventId,
    round_type_id: "f",
    format_id: "a",
  };
}

describe("podiumGoal", () => {
  const goal = podiumGoal(
    podiums([
      final("333", "2020-01-01", 1),
      final("333", "2018-05-01", 1),
      final("333", "2019-01-01", 2),
      final("333", "2021-01-01", 3),
      final("skewb", "2022-01-01", 3),
      final("magic", "2012-01-01", 1), // retired
    ]),
  );

  it("has a row for every current event in WCA order, and none for retired ones", () => {
    expect(goal.rows.map((row) => row.eventId)).toEqual([...CURRENT_EVENT_IDS]);
    expect(goal.total).toBe(CURRENT_EVENT_IDS.length * 3);
  });

  it("counts each placement and remembers the first time", () => {
    const cube = goal.rows.find((row) => row.eventId === "333")!;
    expect(cube.cells.map((cell) => [cell.medal, cell.count])).toEqual([["gold", 2], ["silver", 1], ["bronze", 1]]);
    expect(cube.cells[0].first).toEqual({ competitionId: "Comp2018-05-01", competitionName: "Comp 2018-05-01", startDate: "2018-05-01" });
    expect(cube.cells[0].latest).toEqual({ competitionId: "Comp2020-01-01", competitionName: "Comp 2020-01-01", startDate: "2020-01-01" });
    expect(cube.complete).toBe(true);
  });

  it("leaves missing placements empty", () => {
    const skewb = goal.rows.find((row) => row.eventId === "skewb")!;
    expect(skewb.cells.map((cell) => cell.count)).toEqual([0, 0, 1]);
    expect(skewb.cells[0].first).toBeNull();
    expect(skewb.cells[0].latest).toBeNull();
    expect(skewb.complete).toBe(false);
  });

  it("keeps retired events with podiums apart, out of the goal", () => {
    expect(goal.retired.map((row) => [row.eventId, row.cells.map((cell) => cell.count)])).toEqual([["magic", [1, 0, 0]]]);
  });

  it("tallies placements and complete events", () => {
    expect(goal.done).toBe(4);
    expect(goal.completeEvents).toBe(1);
  });
});
