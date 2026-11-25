import { describe, expect, it } from "vitest";
import { histogram, niceStep, sessionSummary } from "./summary";

const DNF = Infinity;

describe("sessionSummary", () => {
  it("sums up a short session", () => {
    const s = sessionSummary([10000, 12000, DNF, 9000, 11000]);
    expect(s.count).toBe(5);
    expect(s.solved).toBe(4);
    expect(s.dnfs).toBe(1);
    expect(s.mean).toBe(10500);
    expect(s.sd).toBeCloseTo(Math.sqrt(1_250_000));
    expect(s.best).toEqual({ value: 9000, end: 3 });
    expect(s.worst).toEqual({ value: 12000, end: 1 });
    // ao5 of the whole session: drop 9.00 and the DNF.
    expect(s.full).toEqual({ label: "ao5", spec: { kind: "average", size: 5 }, value: 11000 });
    // mo3 is listed; ao5 is the full average, so it isn't repeated.
    expect(s.averages.map((a) => a.label)).toEqual(["mo3"]);
    // Every mo3 here has the DNF in it.
    expect(s.averages[0].best).toEqual({ value: DNF, end: 2 });
  });

  it("finds the best and worst ao5 and ao12 with where they end", () => {
    const values = Array.from({ length: 20 }, (_, i) => 10000 + (i % 7) * 100);
    values[15] = 5000;
    const s = sessionSummary(values);
    const ao5 = s.averages.find((a) => a.label === "ao5")!;
    expect(ao5.best!.value).toBeLessThanOrEqual(ao5.worst!.value);
    expect(ao5.best!.end).toBeGreaterThanOrEqual(4);
    expect(s.averages.map((a) => a.label)).toEqual(["mo3", "ao5", "ao12"]);
    expect(s.full?.label).toBe("ao20");
  });

  it("uses a mean, never ao3 or ao4, for sessions under five solves", () => {
    expect(sessionSummary([1000, 2000, 3000]).full).toEqual({ label: "mo3", spec: { kind: "mean", size: 3 }, value: 2000 });
    expect(sessionSummary([1000, 2000, 3000, 4000]).full?.label).toBe("mo4");
    // mo3 isn't listed twice for a 3-solve session.
    expect(sessionSummary([1000, 2000, 3000]).averages.map((a) => a.label)).toEqual([]);
  });

  it("makes a 100-solve session's full average an ao100 (five dropped each end)", () => {
    const values = Array.from({ length: 100 }, (_, i) => 1000 * (i + 1));
    const s = sessionSummary(values);
    expect(s.full?.label).toBe("ao100");
    // Solves 6–95 count: their mean is 50.5 s.
    expect(s.full?.value).toBe(50500);
    expect(s.averages.map((a) => a.label)).toEqual(["mo3", "ao5", "ao12", "ao50"]);
  });

  it("uses a mean for mean-of-3 events", () => {
    const s = sessionSummary([1000, 2000, 3000], { fullKind: "mean" });
    expect(s.full).toEqual({ label: "mo3", spec: { kind: "mean", size: 3 }, value: 2000 });
    expect(s.averages).toEqual([]);
  });

  it("copes with an empty or all-DNF session", () => {
    expect(sessionSummary([])).toMatchObject({ count: 0, mean: null, sd: null, best: null, full: null, histogram: [] });
    expect(sessionSummary([DNF, DNF, DNF])).toMatchObject({ solved: 0, dnfs: 3, mean: null, full: { value: DNF } });
  });
});

describe("histogram", () => {
  it("puts every solve in round buckets, leaving DNFs out", () => {
    const buckets = histogram([8100, 8900, 9200, 9900, 10400, 12050, DNF]);
    expect(buckets.reduce((n, b) => n + b.count, 0)).toBe(6);
    const width = buckets[0].to - buckets[0].from;
    expect([500, 1000]).toContain(width);
    expect(buckets[0].from).toBeLessThanOrEqual(8100);
    expect(buckets.at(-1)!.to).toBeGreaterThan(12050);
  });

  it("puts identical times in one bucket", () => {
    expect(histogram([5000, 5000, 5000])).toEqual([{ from: 5000, to: 5010, count: 3 }]);
  });

  it("picks round steps", () => {
    expect(niceStep(430)).toBe(500);
    expect(niceStep(180)).toBe(200);
    expect(niceStep(2.2, 1)).toBe(2.5);
    expect(niceStep(0.4, 1)).toBe(1);
  });
});
