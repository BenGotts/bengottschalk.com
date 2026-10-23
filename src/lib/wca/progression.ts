import type { PersonResult } from "./schemas";

export interface PrPoint {
  value: number;
  date: string;
  competitionId: string;
  competitionName: string;
}

export interface Progression {
  single: PrPoint[];
  average: PrPoint[];
}

// Order of rounds within a competition (WCA round_type_id).
const ROUND_ORDER: Record<string, number> = {
  "0": 0, h: 0, "1": 1, d: 1, "2": 2, e: 2, "3": 3, g: 3, b: 3, c: 4, f: 4,
};

function chronological(a: PersonResult, b: PersonResult): number {
  return (
    a.competition_start_date.localeCompare(b.competition_start_date) ||
    a.competition_id.localeCompare(b.competition_id) ||
    (ROUND_ORDER[a.round_type_id] ?? 2) - (ROUND_ORDER[b.round_type_id] ?? 2)
  );
}

/**
 * Each time the person set a new personal record, oldest first. Lower values
 * are better for every event, including Multi-Blind's encoding. Values ≤ 0
 * (no result, DNF, DNS) never count.
 */
export function prProgression(results: PersonResult[]): Progression {
  const single: PrPoint[] = [];
  const average: PrPoint[] = [];
  for (const result of results.toSorted(chronological)) {
    const point = (value: number): PrPoint => ({
      value,
      date: result.competition_start_date,
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
    });
    const bestSingle = single.at(-1)?.value;
    if (result.best > 0 && (bestSingle === undefined || result.best < bestSingle)) single.push(point(result.best));
    const bestAverage = average.at(-1)?.value;
    if (result.average > 0 && (bestAverage === undefined || result.average < bestAverage)) average.push(point(result.average));
  }
  return { single, average };
}
