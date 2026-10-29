import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "./competitions";
import { US_STATE_SHAPES } from "@/content/maps/usStates";
import { countryGoals, stateGoals, US_STATES, usStateCode } from "./goals";

function entry(id: string, date: string, city: string, roles: { competed?: boolean; delegated?: boolean } = { competed: true }, countryIso2 = "US"): HistoryEntry {
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
    latitude_degrees: 0,
    longitude_degrees: 0,
    cancelled_at: null,
    competed: roles.competed ?? false,
    delegated: roles.delegated ?? false,
    resultsPosted: true,
  };
}

const upcoming = (id: string, date: string, city: string, countryIso2 = "US") => ({ id, name: id, start_date: date, city, country_iso2: countryIso2 });

describe("US_STATES", () => {
  it("has all 50 states, each with a shape on the map", () => {
    expect(new Set(US_STATES.map((state) => state.code)).size).toBe(50);
    expect(US_STATE_SHAPES.map((shape) => shape.name).toSorted()).toEqual(US_STATES.map((state) => state.name).toSorted());
  });
});

describe("usStateCode", () => {
  it("reads the state from a WCA city", () => {
    expect(usStateCode({ city: "Portland, Oregon", country_iso2: "US" })).toBe("OR");
    expect(usStateCode({ city: "Washington, District of Columbia", country_iso2: "US" })).toBeNull();
    expect(usStateCode({ city: "Vancouver, British Columbia", country_iso2: "CA" })).toBeNull();
  });
});

const byCode = (goals: ReturnType<typeof stateGoals>) => new Map(goals.map((goal) => [goal.code, goal]));

describe("stateGoals", () => {
  it("marks states competed in, with the first competition there", () => {
    const goals = byCode(stateGoals([
      entry("Later", "2020-01-01", "Portland, Oregon"),
      entry("First", "2016-01-01", "Salem, Oregon"),
    ], []));
    expect(goals.get("OR")).toMatchObject({ status: "competed", count: 2, competition: { id: "First" } });
    expect(goals.get("TX")).toMatchObject({ status: "none", count: 0, competition: null });
  });

  it("keeps delegate-only states apart, and competing there later upgrades them", () => {
    const goals = byCode(stateGoals([
      entry("Delegated", "2019-01-01", "Boise, Idaho", { delegated: true }),
      entry("DelegatedThenCompeted", "2018-01-01", "Seattle, Washington", { delegated: true }),
      entry("Competed", "2021-01-01", "Seattle, Washington", { competed: true, delegated: true }),
    ], []));
    expect(goals.get("ID")?.status).toBe("delegated");
    expect(goals.get("WA")).toMatchObject({ status: "competed", competition: { id: "Competed" } });
  });

  it("shows the next upcoming competition only where there's no past one", () => {
    const goals = byCode(stateGoals([entry("Past", "2020-01-01", "Portland, Oregon")], [
      upcoming("Later", "2027-03-01", "Austin, Texas"),
      upcoming("Sooner", "2027-01-01", "Dallas, Texas"),
      upcoming("Home", "2027-01-01", "Portland, Oregon"),
    ]));
    expect(goals.get("TX")).toMatchObject({ status: "upcoming", count: 0, competition: { id: "Sooner" } });
    expect(goals.get("OR")).toMatchObject({ status: "competed", count: 1, competition: { id: "Past" } });
  });
});

describe("countryGoals", () => {
  it("lists countries competed in first, most competitions first, and leaves out multi-location competitions", () => {
    const goals = countryGoals([
      entry("Canada", "2014-01-01", "Vancouver, British Columbia", { competed: true }, "CA"),
      entry("Usa", "2016-01-01", "Portland, Oregon"),
      entry("Usa2", "2020-01-01", "Seattle, Washington"),
      entry("Mexico", "2015-01-01", "Mexico City", { delegated: true }, "MX"),
      entry("Fmc", "2017-01-01", "Multiple Cities", { competed: true }, "XW"),
    ], [upcoming("Japan", "2027-01-01", "Tokyo", "JP")]);
    expect(goals.map((goal) => [goal.iso2, goal.status])).toEqual([
      ["US", "competed"],
      ["CA", "competed"],
      ["MX", "delegated"],
      ["JP", "upcoming"],
    ]);
    expect(goals[0].name).toBe("United States");
  });
});
