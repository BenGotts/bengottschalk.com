import { describe, expect, it } from "vitest";
import { distanceMiles, travelStats } from "./travel";
import type { HistoryEntry } from "./competitions";

function entry(id: string, date: string, city: string, latitude: number, longitude: number, countryIso2 = "US"): HistoryEntry {
  return {
    id,
    name: id,
    short_name: id,
    start_date: date,
    end_date: date,
    url: "",
    city,
    venue: "",
    country_iso2: countryIso2,
    latitude_degrees: latitude,
    longitude_degrees: longitude,
    cancelled_at: null,
    competed: true,
    delegated: false,
    resultsPosted: true,
  };
}

const PORTLAND = { latitude: 45.52, longitude: -122.68 };
const SEATTLE = { latitude: 47.61, longitude: -122.33 };

describe("distanceMiles", () => {
  it("measures great-circle distance", () => {
    expect(distanceMiles(PORTLAND, SEATTLE)).toBeCloseTo(145, -1);
    expect(distanceMiles(PORTLAND, PORTLAND)).toBe(0);
  });
});

describe("travelStats", () => {
  it("adds up each leg in date order, whatever order the history is in", () => {
    const stats = travelStats([
      entry("C", "2018-01-01", "Portland, Oregon", PORTLAND.latitude, PORTLAND.longitude),
      entry("A", "2016-01-01", "Portland, Oregon", PORTLAND.latitude, PORTLAND.longitude),
      entry("B", "2017-01-01", "Seattle, Washington", SEATTLE.latitude, SEATTLE.longitude),
    ]);
    // Portland → Seattle → Portland.
    expect(stats.totalMiles).toBeCloseTo(2 * distanceMiles(PORTLAND, SEATTLE));
    expect(stats.competitions).toBe(3);
    expect(stats.topCity).toEqual({ city: "Portland, Oregon", countryIso2: "US", count: 2 });
    expect(stats.farthest?.entry.id).toBe("B");
  });

  it("skips multi-location competitions, which have no real venue", () => {
    const stats = travelStats([
      entry("A", "2016-01-01", "Portland, Oregon", PORTLAND.latitude, PORTLAND.longitude),
      entry("FMC", "2016-06-01", "Multiple cities", 0, 0, "XW"),
      entry("B", "2017-01-01", "Portland, Oregon", PORTLAND.latitude, PORTLAND.longitude),
    ]);
    expect(stats.totalMiles).toBe(0);
    expect(stats.competitions).toBe(2);
  });

  it("finds the busiest year, keeping the earliest of a tie", () => {
    const stats = travelStats([
      entry("A", "2016-01-01", "X", 0, 0),
      entry("B", "2016-05-01", "X", 0, 0),
      entry("C", "2017-01-01", "X", 0, 0),
      entry("D", "2017-05-01", "X", 0, 0),
    ]);
    expect(stats.busiestYear).toEqual({ year: "2016", count: 2 });
  });

  it("is empty without competitions", () => {
    expect(travelStats([])).toEqual({ totalMiles: 0, competitions: 0, farthest: null, busiestYear: null, topCity: null });
  });
});
