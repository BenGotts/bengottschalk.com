import { CURRENT_EVENT_IDS } from "./events";
import type { Medal, Podium } from "./stats";

const MEDALS: Medal[] = ["gold", "silver", "bronze"];

/** One placement in one event: how many times, and when it first happened. */
export interface PodiumGoalCell {
  medal: Medal;
  count: number;
  /** The first competition with this placement; null if not yet. */
  first: { competitionId: string; competitionName: string; startDate: string } | null;
}

export interface PodiumGoalRow {
  eventId: string;
  /** 1st, 2nd and 3rd, in that order. */
  cells: PodiumGoalCell[];
  /** Whether every placement in the event is done. */
  complete: boolean;
}

export interface PodiumGoal {
  rows: PodiumGoalRow[];
  /** Placements done, out of `total` (three for each current event). */
  done: number;
  total: number;
  /** Events with all three placements. */
  completeEvents: number;
}

/**
 * The goal of placing 1st, 2nd and 3rd in every current event: a row per event
 * in WCA order, with each placement's count and first time. Retired events
 * don't count.
 */
export function podiumGoal(podiums: Podium[]): PodiumGoal {
  const byKey = new Map<string, Podium[]>();
  for (const podium of podiums) {
    const key = `${podium.result.event_id}:${podium.medal}`;
    byKey.set(key, [...(byKey.get(key) ?? []), podium]);
  }

  const rows = CURRENT_EVENT_IDS.map((eventId): PodiumGoalRow => {
    const cells = MEDALS.map((medal): PodiumGoalCell => {
      const list = byKey.get(`${eventId}:${medal}`) ?? [];
      const first = list.toSorted((a, b) => a.result.competition_start_date.localeCompare(b.result.competition_start_date))[0];
      return {
        medal,
        count: list.length,
        first: first
          ? { competitionId: first.result.competition_id, competitionName: first.result.competition_short_name, startDate: first.result.competition_start_date }
          : null,
      };
    });
    return { eventId, cells, complete: cells.every((cell) => cell.count > 0) };
  });

  return {
    rows,
    done: rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.count > 0).length, 0),
    total: rows.length * MEDALS.length,
    completeEvents: rows.filter((row) => row.complete).length,
  };
}
