import { describe, expect, it } from "vitest";
import { careerMilestones, competitionNumbers, isMilestoneCount, upcomingNumbers } from "./careerMilestones";
import type { CompetitionsOverview, HistoryEntry } from "./competitions";
import type { Competition } from "./schemas";

function entry(id: string, start: string, overrides: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    id,
    name: id,
    short_name: id,
    start_date: start,
    end_date: start,
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

/** `count` competitions, one a week from 2016, newest first like the history; `roles(i)` sets the i-th one's roles. */
function career(count: number, roles: (i: number) => Partial<HistoryEntry> = () => ({})): HistoryEntry[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2016, 0, 2 + i * 7)).toISOString().slice(0, 10);
    return entry(`Comp${String(i + 1).padStart(3, "0")}`, date, roles(i));
  }).toReversed();
}

describe("isMilestoneCount", () => {
  it("marks the first, 10th, 25th, 50th, 75th and every 50th", () => {
    expect([...Array(301).keys()].filter(isMilestoneCount)).toEqual([1, 10, 25, 50, 75, 100, 150, 200, 250, 300]);
  });
});

describe("competitionNumbers", () => {
  it("counts delegate-only competitions as delegated but not competed, and same-day ones by name", () => {
    const numbers = competitionNumbers([
      entry("B", "2022-11-12", { competed: false, delegated: true }),
      entry("A", "2022-11-12", { delegated: true }),
      entry("First", "2016-03-05"),
    ]);
    expect(Object.fromEntries(numbers)).toEqual({
      First: { competition: 1 },
      A: { competition: 2, delegated: 1 },
      B: { delegated: 2 },
    });
  });
});

describe("careerMilestones", () => {
  it("lists competing and delegating milestones, newest first", () => {
    // From the 31st, every third competition is delegated, and every 30th is delegate-only.
    const history = career(110, (i) => (i >= 29 && i % 3 === 0 ? { delegated: true, competed: i % 30 !== 0 } : {}));
    const milestones = careerMilestones(history);
    // Comp031, Comp061 and Comp091 are delegate-only, so each moves later competition numbers back by one.
    expect(milestones.map((m) => [m.competitionId, m.milestones.map((x) => x.label)])).toEqual([
      ["Comp103", ["100th competition", "25th as Delegate"]],
      ["Comp077", ["75th competition"]],
      ["Comp058", ["10th as Delegate"]],
      ["Comp051", ["50th competition"]],
      ["Comp031", ["First competition as Delegate"]],
      ["Comp025", ["25th competition"]],
      ["Comp010", ["10th competition"]],
      ["Comp001", ["First competition"]],
    ]);
  });

  it("puts both milestones on a competition that reaches two", () => {
    const history = career(10, (i) => (i === 9 ? { delegated: true } : {}));
    expect(careerMilestones(history)[0].milestones.map((m) => m.label)).toEqual(["10th competition", "First competition as Delegate"]);
  });
});

function coming(id: string, start: string, delegates: string[] = []): Competition {
  return {
    id,
    name: id,
    short_name: id,
    start_date: start,
    end_date: start,
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
    delegates: delegates.map((wcaId) => ({ id: 1, name: "Delegate", wca_id: wcaId })),
    organizers: [],
  };
}

describe("upcomingNumbers", () => {
  it("continues the counts in date order: registered ones as competitions, delegated ones as delegated", () => {
    const finished = career(157, (i) => (i >= 100 && i < 160 ? { delegated: true, competed: i !== 120 } : {}));
    const overview: CompetitionsOverview = {
      ongoing: [coming("Now", "2026-11-14", ["2016GOTT01"])],
      upcoming: [coming("Later", "2026-12-05"), coming("DelegateOnly", "2026-11-21", ["2016GOTT01"])],
      competing: ["Now", "Later"],
    };
    // 156 competed (one of the 57 delegated was delegate-only), 57 delegated.
    expect(Object.fromEntries(upcomingNumbers(finished, overview, "2016GOTT01"))).toEqual({
      Now: { competition: 157, delegated: 58 },
      DelegateOnly: { delegated: 59 },
      Later: { competition: 158 },
    });
  });
});
