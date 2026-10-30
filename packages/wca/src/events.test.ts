import { describe, expect, it } from "vitest";
import { currentEventIds, eventIconClass, eventName, eventResultType, isCurrentEvent, isKnownEvent, sortEventIds } from "./events";

describe("events", () => {
  it("names current, retired and FTO events", () => {
    expect(eventName("333")).toBe("3x3x3 Cube");
    expect(eventName("333ft")).toBe("3x3x3 With Feet");
    expect(eventName("fto")).toBe("Face-Turning Octahedron");
    expect(eventName("not-an-event")).toBe("not-an-event");
  });

  it("knows result types", () => {
    expect(eventResultType("333fm")).toBe("number");
    expect(eventResultType("333mbf")).toBe("multi");
    expect(eventResultType("fto")).toBe("time");
  });

  it("maps FTO to the unofficial icon", () => {
    expect(eventIconClass("333")).toBe("cubing-icon event-333");
    expect(eventIconClass("fto")).toBe("cubing-icon unofficial-fto");
  });

  it("sorts into WCA order with unknown events last", () => {
    expect(sortEventIds(["sq1", "zzz", "333ft", "222", "333", "fto"])).toEqual([
      "333", "222", "sq1", "fto", "333ft", "zzz",
    ]);
  });

  it("keeps only current events, in WCA order", () => {
    expect(isCurrentEvent("333")).toBe(true);
    expect(isCurrentEvent("333ft")).toBe(false);
    expect(currentEventIds(["sq1", "333ft", "magic", "222", "zzz"])).toEqual(["222", "sq1"]);
  });

  it("recognizes known events", () => {
    expect(isKnownEvent("magic")).toBe(true);
    expect(isKnownEvent("kilominx")).toBe(false);
  });
});
