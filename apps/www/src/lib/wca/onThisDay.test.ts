import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "./competitions";
import { cubingMoments } from "./moments";
import { momentsOn, type CubingMoment } from "./onThisDay";
import type { PersonResult } from "./schemas";

function moment(id: string, start: string, end = start): CubingMoment {
  return {
    competitionId: id,
    competitionName: id,
    url: `https://www.worldcubeassociation.org/competitions/${id}`,
    start,
    end,
    competed: true,
    delegated: false,
    highlights: [],
    moreHighlights: 0,
  };
}

const ids = (day: ReturnType<typeof momentsOn>) => day?.moments.map((m) => m.competitionId);

describe("momentsOn", () => {
  it("finds competitions on the same month and day in past years, newest first", () => {
    const day = momentsOn([moment("A2019", "2019-11-13"), moment("B2023", "2023-11-13"), moment("C2023", "2023-11-14")], "2026-11-13");
    expect(day?.range).toBe("day");
    expect(ids(day)).toEqual(["B2023", "A2019"]);
    expect(day?.moments.map((m) => m.yearsAgo)).toEqual([3, 7]);
  });

  it("matches any day of a multi-day competition, listing it once", () => {
    const weekend = moment("Champs2022", "2022-11-12", "2022-11-14");
    for (const today of ["2026-11-12", "2026-11-13", "2026-11-14"]) {
      expect(ids(momentsOn([weekend], today))).toEqual(["Champs2022"]);
    }
  });

  it("leaves out this year's competitions", () => {
    expect(momentsOn([moment("Now2026", "2026-11-13")], "2026-11-13")).toBeNull();
  });

  it("falls back to the week around the date, then to nothing", () => {
    const moments = [moment("Close", "2021-11-10"), moment("Far", "2021-11-20")];
    const week = momentsOn(moments, "2026-11-13");
    expect(week?.range).toBe("week");
    expect(ids(week)).toEqual(["Close"]);
    expect(momentsOn(moments, "2026-06-01")).toBeNull();
    expect(momentsOn([], "2026-11-13")).toBeNull();
  });

  it("counts the week across the new year", () => {
    expect(ids(momentsOn([moment("NewYear", "2020-12-30")], "2027-01-02"))).toEqual(["NewYear"]);
    expect(ids(momentsOn([moment("NewYear", "2021-01-02")], "2026-12-30"))).toEqual(["NewYear"]);
  });

  it("shows a Feb 29 competition on Feb 28 when the year has no Feb 29", () => {
    const leap = [moment("Leap2020", "2020-02-29")];
    expect(momentsOn(leap, "2026-02-28")?.range).toBe("day");
    expect(momentsOn(leap, "2028-02-29")?.range).toBe("day");
    expect(momentsOn(leap, "2028-02-28")?.range).toBe("week");
  });

  it("shows at most `limit` competitions", () => {
    const many = Array.from({ length: 8 }, (_, i) => moment(`C${2010 + i}`, `${2010 + i}-05-05`));
    const day = momentsOn(many, "2026-05-05");
    expect(day?.moments).toHaveLength(5);
    expect(ids(day)?.[0]).toBe("C2017");
    expect(momentsOn(many, "2026-05-05", { limit: 2 })?.moments).toHaveLength(2);
  });
});

function entry(id: string, start: string, end: string, overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id,
    name: `${id} full name`,
    short_name: id,
    start_date: start,
    end_date: end,
    url: `https://www.worldcubeassociation.org/competitions/${id}`,
    city: "Portland, Oregon",
    venue: "Venue",
    country_iso2: "US",
    latitude_degrees: 45.5,
    longitude_degrees: -122.6,
    cancelled_at: null,
    competed: true,
    delegated: false,
    resultsPosted: true,
    ...overrides,
  };
}

function result(competitionId: string, date: string, eventId: string, roundTypeId: string, pos: number, best: number, average = -1): PersonResult {
  return {
    id: Math.random(),
    pos,
    best,
    average,
    attempts: [],
    regional_single_record: null,
    regional_average_record: null,
    competition_id: competitionId,
    competition_short_name: competitionId,
    competition_start_date: date,
    event_id: eventId,
    round_type_id: roundTypeId,
    format_id: "a",
  };
}

describe("cubingMoments", () => {
  it("gathers each competition's podiums and PRs, podiums first", () => {
    const history = [entry("Open2022", "2022-11-12", "2022-11-13"), entry("Delegated2023", "2023-03-04", "2023-03-04", { competed: false, delegated: true })];
    const results = [result("Open2022", "2022-11-12", "sq1", "f", 1, 1000, 1200), result("Open2022", "2022-11-12", "333", "1", 20, 712)];
    const [open, delegated] = cubingMoments(history, results);
    expect(open.end).toBe("2022-11-13");
    expect(open.highlights.map((h) => h.label)).toEqual([
      "Gold in Square-1",
      "3x3x3 Cube single · 7.12",
      "Square-1 single · 10.00",
    ]);
    expect(open.highlights[1]).toMatchObject({ first: true });
    expect(open.moreHighlights).toBe(1);
    expect(delegated).toMatchObject({ delegated: true, competed: false, highlights: [] });
  });

  it("puts records and broken barriers ahead of routine PRs", () => {
    const history = [entry("Old2021", "2021-01-09", "2021-01-09"), entry("Champs2022", "2022-11-12", "2022-11-13")];
    const results = [
      result("Old2021", "2021-01-09", "222", "1", 9, 400, 500),
      result("Old2021", "2021-01-09", "333", "1", 9, 1200, 1400),
      result("Old2021", "2021-01-09", "sq1", "1", 9, 2000, 2500),
      result("Champs2022", "2022-11-12", "222", "1", 9, 390, 490),
      result("Champs2022", "2022-11-12", "333", "1", 9, 1150, 1350),
      { ...result("Champs2022", "2022-11-12", "sq1", "1", 9, 445, 2400), regional_single_record: "NAR" },
    ];
    const champs = cubingMoments(history, results).find((m) => m.competitionId === "Champs2022");
    expect(champs?.highlights[0]).toMatchObject({ label: "Square-1 single · 4.45", record: "NAR", milestone: "Sub-5" });
  });

  it("keeps a result's competition that's missing from the history, on its start date", () => {
    const [missing] = cubingMoments([], [result("Old2016", "2016-04-09", "333", "1", 30, 2500)]);
    expect(missing).toMatchObject({ competitionId: "Old2016", start: "2016-04-09", end: "2016-04-09", competed: true });
  });
});
