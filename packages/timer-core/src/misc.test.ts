import { describe, expect, it } from "vitest";
import { uuidv7 } from "./id";
import { TIMER_EVENTS, timerEvent } from "./events";
import { localDate, sotdByDate } from "./sotd";

describe("uuidv7", () => {
  it("is a version 7 UUID that sorts by time", () => {
    const a = uuidv7(1_000);
    const b = uuidv7(2_000);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a < b).toBe(true);
  });
});

describe("events", () => {
  it("covers every current WCA event with the right format", () => {
    expect(TIMER_EVENTS.length).toBeGreaterThanOrEqual(17);
    expect(timerEvent("333").format).toBe("ao5");
    expect(timerEvent("666").format).toBe("mo3");
    expect(timerEvent("333bf").inspection).toBe(false);
    expect(timerEvent("333fm").kind).toBe("fewest-moves");
    expect(timerEvent("333mbf").kind).toBe("multi-blind");
    expect(timerEvent("sq1").name).toBe("Square-1");
  });
});

describe("Solve of the Day", () => {
  it("keeps one solve per day and drops unmarked days", () => {
    const map = sotdByDate([
      { date: "2026-11-23", solveId: "a", updatedAt: 1, deletedAt: null },
      { date: "2026-11-22", solveId: "b", updatedAt: 1, deletedAt: 2 },
    ]);
    expect([...map]).toEqual([["2026-11-23", "a"]]);
    expect(localDate(new Date(2026, 10, 23, 23, 59).getTime())).toBe("2026-11-23");
  });
});
