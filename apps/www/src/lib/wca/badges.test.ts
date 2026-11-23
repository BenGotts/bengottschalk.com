import { describe, expect, it } from "vitest";
import { earnedBadges, tripleCrowns, type BadgeInput } from "./badges";
import type { HistoryEntry } from "./competitions";
import { podiumGoal } from "./podiumGoal";
import { PersonSchema, type PersonResult } from "./schemas";
import { podiums } from "./stats";

const rank = (best: number, country: number, world: number) => ({ best, world_rank: world, continent_rank: country, country_rank: country });

const person = PersonSchema.parse({
  person: {
    wca_id: "2016GOTT01",
    name: "Ben",
    url: "u",
    country_iso2: "US",
    country: { id: "USA", name: "United States", continent_id: "_North America" },
    delegate_status: null,
    avatar: null,
  },
  competition_count: 3,
  personal_records: {
    "333": { single: rank(600, 400, 1500), average: rank(787, 425, 1753) },
    sq1: { single: rank(414, 8, 15), average: rank(611, 9, 24) },
  },
  medals: { gold: 4, silver: 1, bronze: 0, total: 5 },
  records: { national: 0, continental: 1, world: 0, total: 1 },
  total_solves: 100,
});

let nextId = 1;
function result(competition: string, eventId: string, pos: number, round = "f", record: string | null = null): PersonResult {
  return {
    id: nextId++,
    pos,
    best: 1000,
    average: 1100,
    attempts: [],
    regional_single_record: record,
    regional_average_record: null,
    competition_id: competition,
    competition_short_name: competition,
    competition_start_date: competition.slice(-10),
    event_id: eventId,
    round_type_id: round,
    format_id: "a",
  };
}

function entry(date: string, country = "US", city = "Portland, Oregon"): HistoryEntry {
  return {
    id: `C${date}`,
    name: `C${date}`,
    short_name: `C${date}`,
    start_date: date,
    end_date: date,
    url: "",
    city,
    venue: "",
    country_iso2: country,
    latitude_degrees: 0,
    longitude_degrees: 0,
    cancelled_at: null,
    competed: true,
    delegated: false,
    resultsPosted: true,
  };
}

// One competition with four golds and a podium in every event, a first round
// that doesn't count, and a North American record.
const results = [
  result("Big 2022-07-01", "333", 1),
  result("Big 2022-07-01", "222", 1),
  result("Big 2022-07-01", "sq1", 1, "f", "NAR"),
  result("Big 2022-07-01", "pyram", 1),
  result("Big 2022-07-01", "skewb", 2),
  result("Big 2022-07-01", "skewb", 5, "1"),
  result("Small 2023-01-01", "333", 4),
];

function input(overrides: Partial<BadgeInput> = {}): BadgeInput {
  return {
    person,
    results,
    podiums: podiums(results),
    history: [entry("2016-03-05")],
    stats: { competed: 1, delegated: 0, countries: 1, usStates: 1 },
    mainEvents: new Map([["Big 2022-07-01", "333"]]),
    isDelegate: false,
    today: "2026-11-23",
    ...overrides,
  };
}

describe("earnedBadges", () => {
  const badges = earnedBadges(input());
  const byId = new Map(badges.map((badge) => [badge.id, badge]));

  it("finds the podium badges at one competition", () => {
    expect(byId.get("winner")?.detail).toBe("Won Big 2022-07-01");
    expect(byId.get("hat-trick")?.detail).toBe("4 golds at Big 2022-07-01");
    expect(byId.get("sweep")?.detail).toBe("A podium in all 5 events at Big 2022-07-01");
    expect(byId.get("haul")?.detail).toBe("5 podiums at Big 2022-07-01");
  });

  it("names records, ranks and the 3x3x3 average", () => {
    expect(byId.get("record")?.detail).toBe("North American record, Square-1 single (10.00)");
    expect(byId.get("national-top-10")?.detail).toBe("#8 in United States, Square-1 single");
    expect(byId.get("world-top")?.name).toBe("World top 25");
    expect(byId.get("sub")).toMatchObject({ name: "Sub-8", detail: "3x3x3 Cube average of 7.87" });
  });

  it("counts years since the first competition", () => {
    expect(byId.get("years")?.name).toBe("A decade of cubing");
    expect(earnedBadges(input({ today: "2026-03-04" })).find((badge) => badge.id === "years")?.name).toBe("5 years of cubing");
  });

  it("leaves out badges not yet earned", () => {
    for (const id of ["competitions", "marathon", "busy-year", "globetrotter", "road-tripper", "delegate"]) expect(byId.has(id)).toBe(false);
  });

  it("uses the highest tier reached", () => {
    const delegatedOne = { ...entry("2019-05-04"), competed: false, delegated: true };
    const more = earnedBadges(
      input({ history: [delegatedOne, entry("2016-03-05")], stats: { competed: 158, delegated: 20, countries: 6, usStates: 12 }, isDelegate: true }),
    );
    const names = new Map(more.map((badge) => [badge.id, badge.name]));
    expect(names.get("competitions")).toBe("150 competitions");
    expect(names.get("globetrotter")).toBe("Globetrotter");
    expect(names.get("road-tripper")).toBe("Road tripper");
    expect(more.find((badge) => badge.id === "delegate")?.detail).toBe("20 competitions delegated since 2019");
  });
});

describe("tripleCrowns", () => {
  it("lists events with all three placements, current ones first", () => {
    const list = podiums([
      result("A 2020-01-01", "clock", 1),
      result("B 2021-01-01", "clock", 2),
      result("C 2022-01-01", "clock", 3),
      result("A 2020-01-01", "333ft", 1),
      result("B 2021-01-01", "333ft", 2),
      result("C 2022-01-01", "333ft", 3),
      result("C 2022-01-01", "skewb", 1),
    ]);
    expect(tripleCrowns(podiumGoal(list)).map(({ row, retired }) => [row.eventId, retired])).toEqual([
      ["clock", false],
      ["333ft", true],
    ]);
  });
});
