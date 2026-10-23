import { describe, expect, it } from "vitest";
import { compareNewestFirst, formatDateSpan, formatYearMonth } from "./dates";

describe("dates", () => {
  it("formats year-months like the old site", () => {
    expect(formatYearMonth("2022-10")).toBe("Oct 2022");
    expect(formatYearMonth("2022-09")).toBe("Sep 2022");
  });

  it("formats spans", () => {
    expect(formatDateSpan({ start: "2022-10", end: "2023-09" })).toBe("Oct 2022 - Sep 2023");
    expect(formatDateSpan({ start: "2023-12", end: null })).toBe("Dec 2023 - Present");
    expect(formatDateSpan({ start: "2022-03", end: "2022-03" })).toBe("Mar 2022");
  });

  it("sorts newest first with ongoing ahead on ties", () => {
    const spans = [
      { start: "2020-01", end: "2020-02" },
      { start: "2023-12", end: "2024-01" },
      { start: "2023-12", end: null },
    ] as const;
    expect(spans.toSorted(compareNewestFirst)).toEqual([spans[2], spans[1], spans[0]]);
  });
});
