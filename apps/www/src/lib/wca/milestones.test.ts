import { describe, expect, it } from "vitest";
import { milestone } from "./milestones";

describe("milestone", () => {
  it("labels the lowest barrier a PR broke", () => {
    expect(milestone("333", "single", 1012, 985)).toBe("Sub-10");
    // 16.00 → 9.50 breaks both sub-15 and sub-10; the lowest wins.
    expect(milestone("333", "average", 1600, 950)).toBe("Sub-10");
    expect(milestone("444", "single", 6100, 5900)).toBe("Sub-1:00");
    expect(milestone("555", "average", 9200, 8900)).toBe("Sub-1:30");
  });

  it("has none when no barrier was crossed", () => {
    expect(milestone("333", "single", 985, 960)).toBeNull();
    // Equalling a barrier isn't breaking it.
    expect(milestone("333", "single", 1050, 1000)).toBeNull();
  });

  it("counts moves for Fewest Moves, including averages (moves × 100)", () => {
    expect(milestone("333fm", "single", 31, 29)).toBe("Sub-30");
    expect(milestone("333fm", "average", 3033, 2967)).toBe("Sub-30");
  });

  it("celebrates a first Blindfolded success, but not other first results", () => {
    expect(milestone("333bf", "single", undefined, 9000)).toBe("First success");
    expect(milestone("333mbf", "single", undefined, 960161200)).toBe("First success");
    expect(milestone("333", "single", undefined, 900)).toBeNull();
  });

  it("has no barriers for Multi-Blind", () => {
    expect(milestone("333mbf", "single", 970360001, 960161200)).toBeNull();
  });
});
