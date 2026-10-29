import { describe, expect, it } from "vitest";
import { isLive } from "./LiveDot";

const window = { id: "SeattleOpen2026", start_date: "2026-11-07", end_date: "2026-11-08", timezone: "America/Los_Angeles" };

describe("isLive", () => {
  it("is on from the venue's first midnight to its last", () => {
    // 07:59 UTC on the 7th is still the 6th in Seattle.
    expect(isLive(window, new Date("2026-11-07T07:59:00Z"))).toBe(false);
    expect(isLive(window, new Date("2026-11-07T08:01:00Z"))).toBe(true);
    // 07:59 UTC on the 9th is still the 8th in Seattle (PST from Nov 1).
    expect(isLive(window, new Date("2026-11-09T07:59:00Z"))).toBe(true);
    expect(isLive(window, new Date("2026-11-09T08:01:00Z"))).toBe(false);
  });

  it("falls back to UTC without a venue time zone", () => {
    expect(isLive({ ...window, timezone: null }, new Date("2026-11-07T00:01:00Z"))).toBe(true);
  });
});
