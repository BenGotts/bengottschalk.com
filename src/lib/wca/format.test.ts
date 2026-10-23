import { describe, expect, it } from "vitest";
import { formatDelegateStatus, formatResult } from "./format";

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
