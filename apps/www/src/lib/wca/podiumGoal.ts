import { CURRENT_EVENT_IDS, RETIRED_EVENT_IDS } from "./events";
import type { Medal, Podium } from "./stats";

const MEDALS: Medal[] = ["gold", "silver", "bronze"];

export interface PodiumCompetition {
  competitionId: string;
  competitionName: string;
  startDate: string;
}

/** One placement in one event: how many times, and when it first and last happened. */
export interface PodiumGoalCell {
  medal: Medal;
  count: number;
  /** The first competition with this placement; null if not yet. */
  first: PodiumCompetition | null;
  /** The latest competition with this placement; null if not yet. */
  latest: PodiumCompetition | null;
}

function competitionOf(podium: Podium | undefined): PodiumCompetition | null {
  if (!podium) return null;
  const { competition_id, competition_short_name, competition_start_date } = podium.result;
  return { competitionId: competition_id, competitionName: competition_short_name, startDate: competition_start_date };
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
  /**
   * Retired events with at least one podium, in WCA order. They're kept for
   * the record but don't count toward the goal, since they can't be won any more.
   */
  retired: PodiumGoalRow[];
  /** Placements done, out of `total` (three for each current event). */
  done: number;
  total: number;
  /** Events with all three placements. */
  completeEvents: number;
}

/**
 * The goal of placing 1st, 2nd and 3rd in every current event: a row per event
 * in WCA order, with each placement's count and first and latest times.
 * Retired events don't count; the ones with podiums are listed apart.
 */
export function podiumGoal(podiums: Podium[]): PodiumGoal {
  const byKey = new Map<string, Podium[]>();
  for (const podium of podiums) {
    const key = `${podium.result.event_id}:${podium.medal}`;
    byKey.set(key, [...(byKey.get(key) ?? []), podium]);
  }

  const rowFor = (eventId: string): PodiumGoalRow => {
    const cells = MEDALS.map((medal): PodiumGoalCell => {
      const list = (byKey.get(`${eventId}:${medal}`) ?? []).toSorted((a, b) =>
        a.result.competition_start_date.localeCompare(b.result.competition_start_date),
      );
      return { medal, count: list.length, first: competitionOf(list[0]), latest: competitionOf(list.at(-1)) };
    });
    return { eventId, cells, complete: cells.every((cell) => cell.count > 0) };
  };
  const rows = CURRENT_EVENT_IDS.map(rowFor);
  const retired = RETIRED_EVENT_IDS.map(rowFor).filter((r) => r.cells.some((cell) => cell.count > 0));

  return {
    rows,
    retired,
    done: rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.count > 0).length, 0),
    total: rows.length * MEDALS.length,
    completeEvents: rows.filter((row) => row.complete).length,
  };
}
