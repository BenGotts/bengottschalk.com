// Averages the WCA (and csTimer) way. Values are milliseconds or move
// counts, with Infinity for a DNF.
//
// - Mean of N: every solve counts; any DNF makes it a DNF.
// - Average of N: the best and worst ceil(5% of N) are dropped (one each for
//   ao5 and ao12, three for ao50, five for ao100) and the rest are averaged.
//   A DNF counts as the worst, so more DNFs than are dropped makes it a DNF.

export type AverageKind = "mean" | "average";

export interface AverageSpec {
  kind: AverageKind;
  size: number;
}

export const trimCount = (size: number): number => Math.ceil(size * 0.05);

/** The label for an average, like "ao5" or "mo3". */
export const averageLabel = ({ kind, size }: AverageSpec): string => `${kind === "mean" ? "mo" : "ao"}${size}`;

/** Reads a label like "ao12" or "mo3" back into its spec; null for anything else (or an average too small to trim). */
export function parseAverageLabel(label: string): AverageSpec | null {
  const match = /^(ao|mo)([1-9]\d{0,4})$/.exec(label.trim().toLowerCase());
  if (!match) return null;
  const size = Number(match[2]);
  const kind: AverageKind = match[1] === "mo" ? "mean" : "average";
  if (kind === "average" ? size < 3 : size < 2) return null;
  return { kind, size };
}

/** Specs in order with duplicates left out (the first of each kept). */
export function uniqueSpecs(...lists: readonly (readonly AverageSpec[])[]): AverageSpec[] {
  const seen = new Set<string>();
  const result: AverageSpec[] = [];
  for (const spec of lists.flat()) {
    const label = averageLabel(spec);
    if (seen.has(label)) continue;
    seen.add(label);
    result.push(spec);
  }
  return result;
}

/** One average of exactly `values.length` values, or null if there are none. */
export function averageOf(values: readonly number[], kind: AverageKind): number | null {
  const size = values.length;
  if (size === 0) return null;
  if (kind === "mean") {
    let sum = 0;
    for (const value of values) {
      if (!Number.isFinite(value)) return Infinity;
      sum += value;
    }
    return sum / size;
  }
  const trim = trimCount(size);
  if (size <= trim * 2) return null;
  const sorted = values.toSorted((a, b) => a - b);
  const kept = sorted.slice(trim, size - trim);
  if (kept.some((value) => !Number.isFinite(value))) return Infinity;
  return kept.reduce((sum, value) => sum + value, 0) / kept.length;
}

export interface AverageBreakdown {
  /** The average (Infinity for DNF), or null when there aren't enough values. */
  value: number | null;
  /** For each value, whether it's dropped from the average: the best and worst ends of an "average of". */
  trimmed: boolean[];
  /** For each value, which end it was dropped from ("best" or "worst"), or null if it counts. */
  dropped: ("best" | "worst" | null)[];
}

/**
 * One average with the solves it drops marked, the way the WCA and csTimer
 * show them in parentheses. For an average of N the best and worst
 * ceil(5% of N) are dropped; a DNF counts as the worst. When values tie, the
 * earlier one is the better one, so the later one is dropped as worst.
 * A mean drops nothing.
 */
export function averageBreakdown(values: readonly number[], kind: AverageKind): AverageBreakdown {
  const dropped: ("best" | "worst" | null)[] = values.map(() => null);
  const value = averageOf(values, kind);
  if (kind === "mean" || value === null) return { value, trimmed: dropped.map(() => false), dropped };
  const trim = trimCount(values.length);
  const order = values
    .map((_, index) => index)
    .toSorted((a, b) => (values[a] === values[b] ? a - b : values[a] < values[b] ? -1 : 1));
  for (const index of order.slice(0, trim)) dropped[index] = "best";
  for (const index of order.slice(order.length - trim)) dropped[index] = "worst";
  return { value, trimmed: dropped.map((end) => end !== null), dropped };
}

/** Where `value` goes in an ascending array (the first index not below it). */
function lowerBound(sorted: number[], value: number): number {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (sorted[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Every rolling average of `size` over `values` (in solve order). Entry `i`
 * is the average of the solves ending at `i`, or null before there are
 * enough. Keeps the window sorted as it slides, so ao1000 over thousands of
 * solves stays fast.
 */
export function rollingAverages(values: readonly number[], { kind, size }: AverageSpec): (number | null)[] {
  const result: (number | null)[] = Array.from({ length: values.length }, () => null);
  if (size <= 0 || values.length < size) return result;
  const trim = kind === "average" ? trimCount(size) : 0;
  if (kind === "average" && size <= trim * 2) return result;

  const window: number[] = [];
  let finiteSum = 0;
  let dnfs = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    window.splice(lowerBound(window, value), 0, value);
    if (Number.isFinite(value)) finiteSum += value;
    else dnfs++;

    if (i >= size) {
      const leaving = values[i - size];
      window.splice(lowerBound(window, leaving), 1);
      if (Number.isFinite(leaving)) finiteSum -= leaving;
      else dnfs--;
    }
    if (i < size - 1) continue;

    if (dnfs > trim) {
      result[i] = Infinity;
      continue;
    }
    // Sum of the kept values: all finite values minus the trimmed ends. The
    // top `trim` slots hold any DNFs first, then the largest finite values.
    let trimmed = 0;
    for (let k = 0; k < trim; k++) trimmed += window[k];
    for (let k = size - trim; k < size; k++) if (Number.isFinite(window[k])) trimmed += window[k];
    result[i] = (finiteSum - trimmed) / (size - 2 * trim);
  }
  return result;
}

export interface AverageStat {
  spec: AverageSpec;
  label: string;
  current: number | null;
  best: number | null;
  /** Index of the last solve of the best average. */
  bestEnd: number | null;
}

export interface SessionStats {
  count: number;
  solved: number;
  /** The latest solve's value. */
  last: number | null;
  best: number | null;
  bestIndex: number | null;
  worst: number | null;
  /** Mean of every solve that isn't a DNF. */
  mean: number | null;
  averages: AverageStat[];
}

export const DEFAULT_AVERAGES: readonly AverageSpec[] = [
  { kind: "mean", size: 3 },
  { kind: "average", size: 5 },
  { kind: "average", size: 12 },
  { kind: "average", size: 50 },
  { kind: "average", size: 100 },
  { kind: "average", size: 1000 },
];

/** Stats over solve values in order (oldest first). */
export function sessionStats(values: readonly number[], specs: readonly AverageSpec[] = DEFAULT_AVERAGES): SessionStats {
  let best: number | null = null;
  let bestIndex: number | null = null;
  let worst: number | null = null;
  let sum = 0;
  let solved = 0;
  values.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    solved++;
    sum += value;
    if (best === null || value < best) {
      best = value;
      bestIndex = index;
    }
    if (worst === null || value > worst) worst = value;
  });

  const averages = specs.map((spec): AverageStat => {
    const rolling = rollingAverages(values, spec);
    let bestAverage: number | null = null;
    let bestEnd: number | null = null;
    rolling.forEach((value, index) => {
      if (value === null) return;
      if (bestAverage === null || value < bestAverage) {
        bestAverage = value;
        bestEnd = index;
      }
    });
    return {
      spec,
      label: averageLabel(spec),
      current: rolling.at(-1) ?? null,
      best: bestAverage,
      bestEnd,
    };
  });

  return { count: values.length, solved, last: values.at(-1) ?? null, best, bestIndex, worst, mean: solved > 0 ? sum / solved : null, averages };
}

/** Whether the latest value set a new best single (strictly better than all before it). */
export function isNewBest(values: readonly number[]): boolean {
  const last = values.at(-1);
  if (last === undefined || !Number.isFinite(last) || values.length < 2) return false;
  return values.slice(0, -1).every((value) => last < value);
}
