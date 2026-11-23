import { describe, expect, it } from "vitest";
import type { PersonResult } from "@/lib/wca";
import { podiums } from "@/lib/wca";
import { podiumRows } from "./podiumRows";

let nextId = 1;
function result(date: string, eventId: string, pos: number, formatId = "a"): PersonResult {
  return {
    id: nextId++,
    pos,
    best: 1000,
    average: 1200,
    attempts: [],
    regional_single_record: null,
    regional_average_record: null,
    competition_id: `Comp${date}`,
    competition_short_name: `Comp ${date}`,
    competition_start_date: date,
    event_id: eventId,
    round_type_id: "f",
    format_id: formatId,
  };
}

describe("podiumRows", () => {
  it("groups podiums by competition, newest first, golds first then by event", () => {
    const rows = podiumRows(
      podiums([
        result("2024-05-01", "333", 1),
        result("2025-03-01", "pyram", 1),
        result("2025-03-01", "333", 2),
        result("2025-03-01", "222", 1),
      ]),
      (_id, date) => date,
    );
    expect(rows.map((row) => [row.competitionId, row.year, row.medals.map((m) => `${m.medal} ${m.eventName}`)])).toEqual([
      ["Comp2025-03-01", "2025", ["gold 2x2x2 Cube", "gold Pyraminx", "silver 3x3x3 Cube"]],
      ["Comp2024-05-01", "2024", ["gold 3x3x3 Cube"]],
    ]);
  });

  it("shows the average for average formats and the single for best-of rounds", () => {
    const [row] = podiumRows(podiums([result("2025-01-01", "333", 1), result("2025-01-01", "333bf", 2, "3")]), (_id, date) => date);
    expect(row.medals.map((m) => [m.kind, m.value])).toEqual([["average", "12.00"], ["single", "10.00"]]);
  });

  it("badges an event's first podium, its first gold later, and completing all three", () => {
    const rows = podiumRows(
      podiums([
        result("2017-01-01", "clock", 3),
        result("2018-01-01", "clock", 2),
        result("2019-01-01", "clock", 1),
        result("2019-01-01", "skewb", 1),
      ]),
      (_, date) => date,
    );
    expect(rows.map((row) => [row.competitionId, row.badges.map((badge) => badge.label)])).toEqual([
      ["Comp2019-01-01", ["All three in Clock", "First Clock gold", "First Skewb podium · gold"]],
      ["Comp2018-01-01", []],
      ["Comp2017-01-01", ["First Clock podium"]],
    ]);
  });

  it("badges every 50th podium overall and round counts in one event", () => {
    // 26 competitions with a 3x3x3 and a 2x2x2 podium each: 52 in all.
    const list = Array.from({ length: 26 }, (_, i) => {
      const date = `20${String(i).padStart(2, "0")}-01-01`;
      return [result(date, "333", 2), result(date, "222", 3)];
    }).flat();
    const withBadges = podiumRows(podiums(list), (_, date) => date)
      .filter((row) => row.badges.length > 0)
      .map((row) => [row.competitionId, row.badges.map((badge) => badge.label)]);
    expect(withBadges).toEqual([
      ["Comp2024-01-01", ["50th podium", "25 3x3x3 Cube podiums", "25 2x2x2 Cube podiums"]],
      ["Comp2009-01-01", ["10 3x3x3 Cube podiums", "10 2x2x2 Cube podiums"]],
      ["Comp2000-01-01", ["First 3x3x3 Cube podium", "First 2x2x2 Cube podium"]],
    ]);
  });

  it("badges a win: gold in the competition's main event", () => {
    const list = podiums([
      result("2020-01-01", "333fm", 1),
      result("2021-01-01", "333", 2),
      result("2021-01-01", "sq1", 1),
      result("2022-01-01", "333", 1),
    ]);
    const mainEvents = new Map([["Comp2020-01-01", "333fm"], ["Comp2021-01-01", "333"], ["Comp2022-01-01", "333"]]);
    const wins = podiumRows(list, (_, date) => date, mainEvents)
      .filter((row) => row.badges.some((badge) => badge.kind === "win"))
      .map((row) => [row.competitionId, row.badges[0].label]);
    expect(wins).toEqual([
      ["Comp2022-01-01", "Won the competition · 3x3x3 Cube"],
      ["Comp2020-01-01", "Won the competition · 3x3x3 Fewest Moves"],
    ]);
  });
});
