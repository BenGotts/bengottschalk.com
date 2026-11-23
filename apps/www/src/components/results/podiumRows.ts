import { podiumItems, type Podium, type PodiumItem } from "@/lib/wca";

export type { PodiumItem };

/** Medal counts: the career total after a competition, or what it added. */
export interface MedalTally {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

export interface PodiumRow {
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  year: string;
  medals: PodiumItem[];
  /** Career medal totals once this competition is counted. */
  totals: MedalTally;
  /** What this competition added to them. */
  added: MedalTally;
  /** A round number of podiums (every 50) this competition reached, if any. */
  milestone: number | null;
}

/** Podium milestones are celebrated every this many. */
export const MILESTONE_EVERY = 50;

const emptyTally = (): MedalTally => ({ gold: 0, silver: 0, bronze: 0, total: 0 });

/**
 * Podiums grouped by competition, newest first, formatted on the server so the
 * browser only renders them. Within a competition: golds first, then by event.
 */
export function podiumRows(podiums: Podium[], dateLabel: (competitionId: string, startDate: string) => string): PodiumRow[] {
  type Group = Pick<PodiumRow, "competitionId" | "competitionName" | "dateLabel" | "year"> & { podiums: Podium[] };
  const rows = new Map<string, Group>();
  for (const podium of podiums) {
    const { result } = podium;
    const row = rows.get(result.competition_id) ?? {
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
      dateLabel: dateLabel(result.competition_id, result.competition_start_date),
      year: result.competition_start_date.slice(0, 4),
      podiums: [],
    };
    row.podiums.push(podium);
    rows.set(result.competition_id, row);
  }

  // Running totals build up from the oldest competition (rows are newest first).
  const running = emptyTally();
  const oldestFirst = [...rows.values()].toReversed().map(({ podiums: list, ...row }): PodiumRow => {
    const added = emptyTally();
    for (const podium of list) {
      added[podium.medal]++;
      added.total++;
    }
    const before = running.total;
    running.gold += added.gold;
    running.silver += added.silver;
    running.bronze += added.bronze;
    running.total += added.total;
    const reached = Math.floor(running.total / MILESTONE_EVERY) * MILESTONE_EVERY;
    return { ...row, medals: podiumItems(list), totals: { ...running }, added, milestone: reached > before ? reached : null };
  });
  return oldestFirst.toReversed();
}
