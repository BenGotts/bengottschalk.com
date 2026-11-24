import { describe, expect, it } from "vitest";
import { averageBreakdown, averageOf, isNewBest, rollingAverages, sessionStats, trimCount } from "./stats";

const D = Infinity;

describe("averageOf", () => {
  it("drops the best and worst of five", () => {
    expect(averageOf([10, 20, 30, 40, 50], "average")).toBe(30);
  });
  it("counts one DNF as the worst", () => {
    expect(averageOf([10, 20, 30, 40, D], "average")).toBe(30);
  });
  it("is a DNF with two DNFs in an ao5", () => {
    expect(averageOf([10, 20, 30, D, D], "average")).toBe(Infinity);
  });
  it("means are DNF with any DNF", () => {
    expect(averageOf([10, 20, 30], "mean")).toBe(20);
    expect(averageOf([10, 20, D], "mean")).toBe(Infinity);
  });
  it("trims 5% from each end", () => {
    expect([5, 12, 50, 100, 1000].map(trimCount)).toEqual([1, 1, 3, 5, 50]);
  });
});

describe("rollingAverages", () => {
  it("matches averageOf for every window", () => {
    const values = Array.from({ length: 300 }, (_, i) => (i % 17 === 0 ? D : 8000 + ((i * 7919) % 5000)));
    for (const size of [5, 12, 50, 100]) {
      const rolling = rollingAverages(values, { kind: "average", size });
      for (let i = 0; i < values.length; i++) {
        const expected = i < size - 1 ? null : averageOf(values.slice(i - size + 1, i + 1), "average");
        if (expected === null || !Number.isFinite(expected)) expect(rolling[i]).toBe(expected);
        else expect(rolling[i]).toBeCloseTo(expected, 6);
      }
    }
  });
  it("handles means", () => {
    expect(rollingAverages([1, 2, 3, D, 5], { kind: "mean", size: 3 })).toEqual([null, null, 2, D, D]);
  });
});

describe("sessionStats", () => {
  it("finds best, worst, mean and averages", () => {
    const stats = sessionStats([12, 10, D, 14, 9, 11]);
    expect(stats.count).toBe(6);
    expect(stats.solved).toBe(5);
    expect(stats.best).toBe(9);
    expect(stats.bestIndex).toBe(4);
    expect(stats.worst).toBe(14);
    expect(stats.mean).toBeCloseTo(11.2);
    const ao5 = stats.averages.find((a) => a.label === "ao5")!;
    expect(ao5.current).toBeCloseTo((10 + 14 + 11) / 3);
    expect(ao5.best).toBeCloseTo((10 + 14 + 11) / 3);
    expect(ao5.bestEnd).toBe(5);
  });
  it("isNewBest", () => {
    expect(isNewBest([10, 9])).toBe(true);
    expect(isNewBest([10, 10])).toBe(false);
    expect(isNewBest([10])).toBe(false);
  });
});

describe("averageBreakdown", () => {
  it("marks the best and worst of an ao5", () => {
    const { value, trimmed } = averageBreakdown([5000, 1000, 3000, 9000, 7000], "average");
    expect(value).toBe(5000);
    expect(trimmed).toEqual([false, true, false, true, false]);
    // Which end each dropped time came from (for showing the best green and the worst red).
    expect(averageBreakdown([5000, 1000, 3000, 9000, 7000], "average").dropped).toEqual([null, "best", null, "worst", null]);
  });

  it("counts a DNF as the worst", () => {
    const { value, trimmed } = averageBreakdown([5000, Infinity, 3000, 2000, 4000], "average");
    expect(value).toBe(4000);
    expect(trimmed).toEqual([false, true, false, true, false]);
  });

  it("is a DNF with two DNFs in an ao5, dropping only one", () => {
    const { value, trimmed } = averageBreakdown([5000, Infinity, 3000, Infinity, 4000], "average");
    expect(value).toBe(Infinity);
    expect(trimmed).toEqual([false, false, true, true, false]);
  });

  it("drops the later of two equal worst times", () => {
    const { trimmed } = averageBreakdown([6000, 9000, 5000, 9000, 7000], "average");
    expect(trimmed).toEqual([false, false, true, true, false]);
  });

  it("drops five at each end of an ao100", () => {
    const values = Array.from({ length: 100 }, (_, i) => 10_000 + ((i * 37) % 100) * 10);
    const { value, trimmed } = averageBreakdown(values, "average");
    expect(trimmed.filter(Boolean)).toHaveLength(10);
    expect(value).toBe(averageOf(values, "average"));
    const kept = values.filter((_, i) => !trimmed[i]);
    expect(Math.min(...kept)).toBeGreaterThan(Math.min(...values.filter((_, i) => trimmed[i])));
  });

  it("drops nothing from a mean", () => {
    expect(averageBreakdown([3000, 4000, 5000], "mean")).toEqual({ value: 4000, trimmed: [false, false, false], dropped: [null, null, null] });
  });

  it("matches the rolling averages", () => {
    const values = [8100, 7200, Infinity, 9050, 6400, 8800, 7700, 9900, 6100, 8300, 7000, 9400];
    const rolling = rollingAverages(values, { kind: "average", size: 5 });
    for (let end = 4; end < values.length; end++) {
      expect(averageBreakdown(values.slice(end - 4, end + 1), "average").value).toBeCloseTo(rolling[end]!, 6);
    }
  });
});

