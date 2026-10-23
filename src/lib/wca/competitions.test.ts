import { describe, expect, it } from "vitest";
import { hasStaffRole, mergeCompetitions, utcDateString } from "./competitions";
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
      today,
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
      today,
    );
    expect(overview.ongoing.map((c) => c.id)).toEqual(["EndsToday", "StartsToday"]);
    expect(overview.upcoming.map((c) => c.id)).toEqual(["Tomorrow"]);
  });

  it("drops cancelled competitions", () => {
    const overview = mergeCompetitions(
      { ongoing_competitions: [], upcoming_competitions: [competition("Cancelled", "2026-12-01", "2026-12-01", { cancelled_at: "2026-10-01T00:00:00Z" })] },
      [],
      today,
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

describe("utcDateString", () => {
  it("uses the UTC date", () => {
    expect(utcDateString(new Date("2026-10-24T23:30:00-07:00"))).toBe("2026-10-25");
  });
});
