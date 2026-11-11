import { describe, expect, it } from "vitest";
import { stateGoals, US_STATES } from "./goals";
import { CUBING_USA_REGIONS, cubingUsaRegion, regionProgress } from "./regions";

describe("CUBING_USA_REGIONS", () => {
  it("puts each of the 50 states in exactly one region", () => {
    const codes = CUBING_USA_REGIONS.flatMap((region) => region.states);
    expect(codes.toSorted()).toEqual(US_STATES.map((state) => state.code).toSorted());
  });

  it("finds a state's region", () => {
    expect(cubingUsaRegion("OR")).toBe("Northwest");
    expect(cubingUsaRegion("MI")).toBe("Great Lakes");
    expect(cubingUsaRegion("DC")).toBeUndefined();
  });
});

const entry = (id: string, city: string, competed: boolean) => ({
  id, name: id, short_name: id, start_date: "2020-01-01", end_date: "2020-01-01", url: "", city, venue: "",
  country_iso2: "US", latitude_degrees: 0, longitude_degrees: 0, cancelled_at: null,
  competed, delegated: !competed, resultsPosted: true,
});

describe("regionProgress", () => {
  it("counts states competed in per region, not delegate-only ones", () => {
    const progress = regionProgress(stateGoals([
      entry("A", "Portland, Oregon", true),
      entry("B", "Seattle, Washington", true),
      entry("C", "Boise, Idaho", false),
    ], []));
    expect(progress.find((region) => region.name === "Northwest")).toEqual({ name: "Northwest", states: ["AK", "OR", "WA"], competed: 2 });
    expect(progress.find((region) => region.name === "Rocky Mountain")?.competed).toBe(0);
  });
});
