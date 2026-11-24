// A session's summary, for the end of a temporary session (or any session):
// counts, mean and spread, best and worst singles and averages, the
// session's own full average, and how the times are spread out.
//
// Values are milliseconds or move counts in solve order, Infinity for a DNF,
// as everywhere else in timer-core.

import { averageLabel, averageOf, rollingAverages, type AverageKind, type AverageSpec } from "./stats";

/** An average with where it ends, so it can be opened to show its solves. */
export interface PlacedAverage {
  value: number;
  /** Index of the average's last solve. */
  end: number;
}

export interface SummaryAverage {
  spec: AverageSpec;
  label: string;
  best: PlacedAverage | null;
  /** The worst one (a DNF average counts as the worst). */
  worst: PlacedAverage | null;
}

export interface HistogramBucket {
  /** Inclusive lower bound. */
  from: number;
  /** Exclusive upper bound (the last bucket also holds its upper bound). */
  to: number;
  count: number;
}

export interface SessionSummary {
  count: number;
  solved: number;
  dnfs: number;
  /** Mean of the solves that aren't DNFs. */
  mean: number | null;
  /** Population standard deviation of the solves that aren't DNFs. */
  sd: number | null;
  best: PlacedAverage | null;
  worst: PlacedAverage | null;
  /**
   * Every solve as one average: ao100 for a 100-solve session (the best and
   * worst 5% dropped, as the WCA does), or a mean for mean-of-3 events.
   */
  full: { label: string; spec: AverageSpec; value: number } | null;
  averages: SummaryAverage[];
  histogram: HistogramBucket[];
}

/** The averages a summary lists, when there are enough solves for them. */
export const SUMMARY_AVERAGES: readonly AverageSpec[] = [
  { kind: "mean", size: 3 },
  { kind: "average", size: 5 },
  { kind: "average", size: 12 },
  { kind: "average", size: 50 },
  { kind: "average", size: 100 },
];

/** A round bucket width near `rough`: 1, 2, 2.5 or 5 times a power of ten, and at least `min`. */
export function niceStep(rough: number, min = 1): number {
  if (!(rough > min)) return min;
  const power = 10 ** Math.floor(Math.log10(rough));
  for (const factor of [1, 2, 2.5, 5, 10]) {
    if (power * factor >= rough) return Math.max(min, power * factor);
  }
  return Math.max(min, power * 10);
}

/**
 * How the solves (not DNFs) spread out, in about `target` buckets of a round
 * width. `minStep` keeps buckets from getting silly: 10 ms for times, 1 for
 * move counts.
 */
export function histogram(values: readonly number[], { target = 8, minStep = 10 }: { target?: number; minStep?: number } = {}): HistogramBucket[] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const step = niceStep((max - min) / target, minStep);
  const start = Math.floor(min / step) * step;
  const buckets = Math.max(1, Math.floor((max - start) / step) + 1);
  const result: HistogramBucket[] = Array.from({ length: buckets }, (_, i) => ({ from: start + i * step, to: start + (i + 1) * step, count: 0 }));
  for (const value of finite) result[Math.min(buckets - 1, Math.floor((value - start) / step))].count++;
  return result;
}

function bestAndWorst(rolling: readonly (number | null)[]): { best: PlacedAverage | null; worst: PlacedAverage | null } {
  let best: PlacedAverage | null = null;
  let worst: PlacedAverage | null = null;
  rolling.forEach((value, end) => {
    if (value === null) return;
    if (best === null || value < best.value) best = { value, end };
    if (worst === null || value > worst.value) worst = { value, end };
  });
  return { best, worst };
}

/**
 * Sums up a session. `fullKind`: how to average every solve together, "mean"
 * for mean-of-3 events and "average" otherwise. `minStep`: the smallest
 * histogram bucket (10 ms for times, 1 for move counts).
 */
export function sessionSummary(values: readonly number[], { fullKind = "average", minStep = 10 }: { fullKind?: AverageKind; minStep?: number } = {}): SessionSummary {
  const finite = values.filter((v) => Number.isFinite(v));
  const solved = finite.length;
  const mean = solved > 0 ? finite.reduce((a, b) => a + b, 0) / solved : null;
  const sd = mean === null ? null : Math.sqrt(finite.reduce((sum, v) => sum + (v - mean) ** 2, 0) / solved);

  let best: PlacedAverage | null = null;
  let worst: PlacedAverage | null = null;
  values.forEach((value, end) => {
    if (!Number.isFinite(value)) return;
    if (best === null || value < best.value) best = { value, end };
    if (worst === null || value > worst.value) worst = { value, end };
  });

  const fullSpec: AverageSpec = { kind: fullKind, size: values.length };
  const fullValue = values.length >= 3 ? averageOf(values, fullKind) : null;

  const averages = SUMMARY_AVERAGES
    // The full average already covers a session exactly as long as one of these.
    .filter((spec) => values.length >= spec.size && !(spec.size === values.length && spec.kind === fullKind))
    .map((spec) => ({ spec, label: averageLabel(spec), ...bestAndWorst(rollingAverages(values, spec)) }));

  return {
    count: values.length,
    solved,
    dnfs: values.length - solved,
    mean,
    sd,
    best,
    worst,
    full: fullValue === null ? null : { label: averageLabel(fullSpec), spec: fullSpec, value: fullValue },
    averages,
    histogram: histogram(values, { minStep }),
  };
}
