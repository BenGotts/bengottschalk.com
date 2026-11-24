import { describe, expect, it } from "vitest";
import { averageOf, isNewBest, rollingAverages, sessionStats, trimCount } from "./stats";

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
