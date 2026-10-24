import { describe, expect, it } from "vitest";
import {
  addDays,
  buildCompetitionHistory,
  finishedCompetitions,
  groupByYear,
  groupMapLocations,
  hasStaffRole,
  historyStats,
  isMultiLocation,
  isNearToday,
  localDateString,
  mergeCompetitions,
  utcDateString,
} from "./competitions";
import type { Competition } from "./schemas";

function competition(id: string, start: string, end: string, overrides: Partial<Competition> = {}): Competition {
  return {
    id,
    name: id,
    short_name: id,
    start_date: start,
    end_date: end,
    url: `https://www.worldcubeassociation.org/competitions/${id}`,
    website: null,
    city: "Portland, Oregon",
    venue: "Venue",
    country_iso2: "US",
    latitude_degrees: 45.5,
    longitude_degrees: -122.6,
    results_posted_at: null,
    cancelled_at: null,
    event_ids: ["333"],
    date_range: "",
    delegates: [],
    organizers: [],
    ...overrides,
  };
}

const today = "2026-10-24";

describe("mergeCompetitions", () => {
  it("adds delegate-only competitions and removes duplicates", () => {
    const registered = competition("Registered2026", "2026-11-01", "2026-11-01");
    const overview = mergeCompetitions(
      { ongoing_competitions: [], upcoming_competitions: [registered] },
      [competition("DelegateOnly2026", "2026-10-30", "2026-10-31"), registered],
      () => today,
    );
    expect(overview.upcoming.map((c) => c.id)).toEqual(["DelegateOnly2026", "Registered2026"]);
    expect(overview.ongoing).toEqual([]);
  });

  it("classifies by date, including multi-day competitions", () => {
    const overview = mergeCompetitions(
      { ongoing_competitions: [], upcoming_competitions: [] },
      [
        competition("StartsToday", today, today),
        competition("EndsToday", "2026-10-23", today),
        competition("Tomorrow", "2026-10-25", "2026-10-25"),
        competition("Yesterday", "2026-10-23", "2026-10-23"),
      ],
      () => today,
    );
    expect(overview.ongoing.map((c) => c.id)).toEqual(["EndsToday", "StartsToday"]);
    expect(overview.upcoming.map((c) => c.id)).toEqual(["Tomorrow"]);
  });

  it("drops cancelled competitions", () => {
    const overview = mergeCompetitions(
      { ongoing_competitions: [], upcoming_competitions: [competition("Cancelled", "2026-12-01", "2026-12-01", { cancelled_at: "2026-10-01T00:00:00Z" })] },
      [],
      () => today,
    );
    expect(overview.upcoming).toEqual([]);
  });
});

describe("hasStaffRole", () => {
  it("detects delegate and organizer roles by WCA ID", () => {
    const staffed = competition("Staffed", today, today, {
      delegates: [{ id: 1, wca_id: "2016GOTT01", name: "Ben" }],
      organizers: [{ id: 2, wca_id: null, name: "Someone" }],
    });
    expect(hasStaffRole(staffed, "2016GOTT01")).toEqual({ isDelegate: true, isOrganizer: false });
  });
});

describe("buildCompetitionHistory", () => {
  it("merges competed and delegated, keeps only finished competitions, newest first", () => {
    const history = buildCompetitionHistory(
      [competition("Both2025", "2025-05-01", "2025-05-01"), competition("Competed2024", "2024-01-01", "2024-01-02")],
      [
        competition("Both2025", "2025-05-01", "2025-05-01"),
        competition("DelegatedOnly2025", "2025-08-01", "2025-08-01", { city: "Seattle, Washington" }),
        competition("Upcoming2026", "2026-12-01", "2026-12-01"),
        competition("Cancelled2025", "2025-09-01", "2025-09-01", { cancelled_at: "2025-08-01T00:00:00Z" }),
      ],
      today,
    );
    expect(history.map((h) => [h.id, h.competed, h.delegated])).toEqual([
      ["DelegatedOnly2025", false, true],
      ["Both2025", true, true],
      ["Competed2024", true, false],
    ]);
    expect(historyStats(history)).toEqual({ competed: 2, delegated: 2, countries: 1, usStates: 2 });
  });
});

describe("multi-location competitions", () => {
  // Ben's real data: FMC2019 is XW at 0,0; FMC Americas 2018 is XM.
  const fmcWorld = competition("FMC2019", "2019-04-13", "2019-04-14", { country_iso2: "XW", city: "Multiple Cities", latitude_degrees: 0, longitude_degrees: 0 });
  const fmcAmericas = competition("FMCAmericas2018", "2018-11-04", "2018-11-04", { country_iso2: "XM", city: "Multiple cities" });
  const paris = competition("WC2017", "2017-07-14", "2017-07-16", { country_iso2: "FR", city: "Paris" });

  it("aren't counted as countries", () => {
    const history = buildCompetitionHistory([fmcWorld, fmcAmericas, paris, competition("Local", "2020-01-01", "2020-01-01")], [], today);
    expect(historyStats(history).countries).toBe(2);
    expect(isMultiLocation(fmcWorld)).toBe(true);
    expect(isMultiLocation(paris)).toBe(false);
  });

  it("aren't put on the map", () => {
    const locations = groupMapLocations([fmcWorld, fmcAmericas, paris].map((c) => ({ competition: c, status: "past" as const })));
    expect(locations.flatMap((l) => l.competitions.map((c) => c.id))).toEqual(["WC2017"]);
  });
});

describe("groupByYear", () => {
  it("groups newest year first", () => {
    const groups = groupByYear([{ start_date: "2025-01-01" }, { start_date: "2026-03-01" }, { start_date: "2025-06-01" }]);
    expect(groups.map((g) => [g.year, g.entries.length])).toEqual([["2026", 1], ["2025", 2]]);
  });
});

describe("groupMapLocations", () => {
  it("combines competitions at the same venue and prefers the most current status", () => {
    const venue = { latitude_degrees: 45.52311, longitude_degrees: -122.67651 };
    const locations = groupMapLocations([
      { competition: competition("Old", "2019-01-01", "2019-01-01", venue), status: "past" },
      { competition: competition("Soon", "2026-11-01", "2026-11-01", { ...venue, date_range: "Nov 1, 2026" }), status: "upcoming" },
      { competition: competition("Elsewhere", "2020-01-01", "2020-01-01", { latitude_degrees: 47.6, longitude_degrees: -122.3 }), status: "past" },
    ]);
    expect(locations).toHaveLength(2);
    const portland = locations.find((l) => l.competitions.length === 2);
    expect(portland?.status).toBe("upcoming");
    expect(portland?.competitions.map((c) => [c.id, c.dateLabel])).toEqual([["Soon", "Nov 1, 2026"], ["Old", "2019-01-01"]]);
  });
});

describe("utcDateString", () => {
  it("uses the UTC date", () => {
    expect(utcDateString(new Date("2026-10-24T23:30:00-07:00"))).toBe("2026-10-25");
  });
});

describe("local dates", () => {
  it("formats a date in a venue's time zone", () => {
    // 5:30 PM Saturday in Oregon is already Sunday in UTC.
    expect(localDateString(new Date("2026-10-25T00:30:00Z"), "America/Los_Angeles")).toBe("2026-10-24");
    // 1 AM Saturday in Seoul is still Friday in UTC.
    expect(localDateString(new Date("2026-10-23T16:00:00Z"), "Asia/Seoul")).toBe("2026-10-24");
  });

  it("adds days across month boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("knows which competitions could be underway somewhere today", () => {
    expect(isNearToday({ start_date: "2026-10-24", end_date: "2026-10-24" }, "2026-10-25")).toBe(true);
    expect(isNearToday({ start_date: "2026-10-26", end_date: "2026-10-26" }, "2026-10-25")).toBe(true);
    expect(isNearToday({ start_date: "2026-10-27", end_date: "2026-10-27" }, "2026-10-25")).toBe(false);
    expect(isNearToday({ start_date: "2026-10-23", end_date: "2026-10-23" }, "2026-10-25")).toBe(false);
  });
});

/** "Today" for a competition, as seen in Oregon at a given UTC instant. */
const inOregon = (now: string) => () => localDateString(new Date(now), "America/Los_Angeles");

describe("Oregon City Spooktacular across UTC midnight", () => {
  // One-day competition in Oregon on Saturday, Oct 24.
  const spooktacular = competition("OregonCitySpooktacular2026", "2026-10-24", "2026-10-24");

  it("is upcoming on Friday evening, even though UTC has reached Saturday", () => {
    const overview = mergeCompetitions({ ongoing_competitions: [], upcoming_competitions: [] }, [spooktacular], inOregon("2026-10-24T00:30:00Z"));
    expect(overview.upcoming.map((c) => c.id)).toEqual(["OregonCitySpooktacular2026"]);
    expect(overview.ongoing).toEqual([]);
  });

  it("is still happening on Saturday evening, after UTC has reached Sunday", () => {
    const overview = mergeCompetitions({ ongoing_competitions: [], upcoming_competitions: [] }, [spooktacular], inOregon("2026-10-25T00:30:00Z"));
    expect(overview.ongoing.map((c) => c.id)).toEqual(["OregonCitySpooktacular2026"]);
  });

  it("is finished once Saturday ends in Oregon", () => {
    const overview = mergeCompetitions({ ongoing_competitions: [], upcoming_competitions: [] }, [spooktacular], inOregon("2026-10-25T07:30:00Z"));
    expect(overview.ongoing).toEqual([]);
    expect(overview.upcoming).toEqual([]);
  });

  it("only moves into the past list once it is no longer running", () => {
    const history = buildCompetitionHistory([], [spooktacular], "2026-10-25");
    const running = { ongoing: [spooktacular], upcoming: [] };
    expect(finishedCompetitions(history, running, "2026-10-25")).toEqual([]);
    expect(finishedCompetitions(history, { ongoing: [], upcoming: [] }, "2026-10-25").map((h) => h.id)).toEqual(["OregonCitySpooktacular2026"]);
    // Without an overview, fall back to the UTC date.
    expect(finishedCompetitions(history, null, "2026-10-24")).toEqual([]);
  });
});
