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
});
