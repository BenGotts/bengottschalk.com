import { describe, expect, it } from "vitest";
import { uuidv7 } from "./id";
import { formatAverageSpec, TIMER_EVENTS, timerEvent } from "./events";
import { localDate, sotdByEventDay, sotdKey, sotdReplaceQuestion, withMarkEvents } from "./sotd";

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
  it("keeps one solve per event per day and drops unmarked days", () => {
    const map = sotdByEventDay([
      { eventId: "333", date: "2026-11-23", solveId: "a", updatedAt: 1, deletedAt: null },
      { eventId: "sq1", date: "2026-11-23", solveId: "c", updatedAt: 1, deletedAt: null },
      { eventId: "333", date: "2026-11-22", solveId: "b", updatedAt: 1, deletedAt: 2 },
    ]);
    expect([...map]).toEqual([[sotdKey("333", "2026-11-23"), "a"], [sotdKey("sq1", "2026-11-23"), "c"]]);
    expect(map.get(sotdKey("333", "2026-11-22"))).toBeUndefined();
    expect(localDate(new Date(2026, 10, 23, 23, 59).getTime())).toBe("2026-11-23");
    expect(sotdReplaceQuestion("333", "this day")).toBe("Another 3×3 solve is already Solve of the Day for this day. Replace it with this one?");
  });

  it("gives older marks the event of their solve", () => {
    const events: Record<string, string> = { a: "333", b: "sq1", c: "333" };
    const marks = withMarkEvents([
      { date: "2026-11-23", solveId: "a", updatedAt: 1, deletedAt: null, pendingSync: 0 },
      { date: "2026-11-22", solveId: "b", updatedAt: 2, deletedAt: 5 },
      { date: "2026-11-21", solveId: "gone", updatedAt: 1, deletedAt: null },
      { eventId: "444", date: "2026-11-20", solveId: "x", updatedAt: 1, deletedAt: null },
    ], (id) => events[id]);
    expect(marks).toEqual([
      { eventId: "333", date: "2026-11-23", solveId: "a", updatedAt: 1, deletedAt: null, pendingSync: 0 },
      { eventId: "sq1", date: "2026-11-22", solveId: "b", updatedAt: 2, deletedAt: 5 },
      { eventId: "444", date: "2026-11-20", solveId: "x", updatedAt: 1, deletedAt: null },
    ]);
    // Two marks for one event and day (only from merging backups): the newer edit stays.
    expect(withMarkEvents([
      { date: "2026-11-23", solveId: "a", updatedAt: 1, deletedAt: null },
      { date: "2026-11-23", solveId: "c", updatedAt: 3, deletedAt: null },
    ], (id) => events[id]).map((m) => m.solveId)).toEqual(["c"]);
  });
});

describe("event formats", () => {
  it("averages each event the way cubers expect", () => {
    const formats = Object.fromEntries(TIMER_EVENTS.map((event) => [event.id, event.format]));
    expect(formats).toEqual({
      "333": "ao5", "222": "ao5", "444": "ao5", "555": "ao5", "666": "mo3", "777": "mo3",
      "333bf": "ao5", "333fm": "mo3", "333oh": "ao5", clock: "ao5", minx: "ao5", pyram: "ao5",
      skewb: "ao5", sq1: "ao5", "444bf": "mo3", "555bf": "mo3", "333mbf": "best", fto: "ao5",
    });
  });

  it("leads with mo3 or ao5, and nothing for single-result events", () => {
    expect(formatAverageSpec(timerEvent("333bf").format)).toEqual({ kind: "average", size: 5 });
    expect(formatAverageSpec(timerEvent("444bf").format)).toEqual({ kind: "mean", size: 3 });
    expect(formatAverageSpec(timerEvent("333mbf").format)).toBeNull();
  });
});
