import { describe, expect, it } from "vitest";
import { competitionDateLabels, formatDateRange, formatDelegateStatus, formatImprovement, formatResult } from "./format";

// Values are Ben's personal records as returned by the WCA API.
describe("formatResult", () => {
  it("formats times in centiseconds", () => {
    expect(formatResult("222", 105)).toBe("1.05");
    expect(formatResult("333", 802, "average")).toBe("8.02");
    expect(formatResult("333bf", 9343)).toBe("1:33.43");
    expect(formatResult("444bf", 74000)).toBe("12:20.00");
  });

  it("formats FMC singles as moves and averages with two decimals", () => {
    expect(formatResult("333fm", 21)).toBe("21");
    expect(formatResult("333fm", 2833, "average")).toBe("28.33");
  });

  it("decodes Multi-Blind results", () => {
    expect(formatResult("333mbf", 960161200)).toBe("3/3 26:52");
  });

  it("formats retired and missing-from-helpers events", () => {
    expect(formatResult("333ft", 2813)).toBe("28.13");
    expect(formatResult("fto", 2500)).toBe("25.00");
  });

  it("handles DNF, DNS and no result", () => {
    expect(formatResult("333", -1)).toBe("DNF");
    expect(formatResult("333mbf", -1)).toBe("DNF");
    expect(formatResult("333", -2)).toBe("DNS");
    expect(formatResult("333", 0)).toBe("");
  });
});

describe("formatDelegateStatus", () => {
  it("labels known statuses", () => {
    expect(formatDelegateStatus("regional_delegate")).toBe("Regional Delegate");
    expect(formatDelegateStatus("trainee_delegate")).toBe("Trainee Delegate");
  });

  it("title-cases unknown statuses", () => {
    expect(formatDelegateStatus("area_lead_delegate")).toBe("Area Lead Delegate");
  });
});

describe("formatImprovement", () => {
  it("formats the drop in each event's units", () => {
    expect(formatImprovement("333", 985, 921)).toBe("−0.64");
    expect(formatImprovement("333", 6100, 5900)).toBe("−2.00");
    expect(formatImprovement("333fm", 31, 28)).toBe("−3");
    expect(formatImprovement("333fm", 3133, 2900, "average")).toBe("−2.33");
  });

  it("has nothing for Multi-Blind or a non-improvement", () => {
    expect(formatImprovement("333mbf", 970360001, 960161200)).toBeNull();
    expect(formatImprovement("333", 900, 900)).toBeNull();
  });
});

describe("formatDateRange", () => {
  it("shows one date for a one-day competition", () => {
    expect(formatDateRange("2025-05-01", "2025-05-01")).toBe("May 1, 2025");
  });

  it("shortens ranges within a month or a year", () => {
    expect(formatDateRange("2025-05-01", "2025-05-03")).toBe("May 1 – 3, 2025");
    expect(formatDateRange("2025-04-30", "2025-05-02")).toBe("Apr 30 – May 2, 2025");
    expect(formatDateRange("2025-12-31", "2026-01-01")).toBe("Dec 31, 2025 – Jan 1, 2026");
  });
});

describe("competitionDateLabels", () => {
  it("looks up end dates by competition, falling back to the start date", () => {
    const label = competitionDateLabels([{ id: "Weekend2025", end_date: "2025-05-04" }]);
    expect(label("Weekend2025", "2025-05-03")).toBe("May 3 – 4, 2025");
    expect(label("Unknown2025", "2025-05-03")).toBe("May 3, 2025");
  });
});
