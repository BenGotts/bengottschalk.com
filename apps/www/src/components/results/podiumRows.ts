import { podiumItems, type Podium, type PodiumItem } from "@/lib/wca";

export type { PodiumItem };

export interface PodiumRow {
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  year: string;
  medals: PodiumItem[];
}

/**
 * Podiums grouped by competition, newest first, formatted on the server so the
 * browser only renders them. Within a competition: golds first, then by event.
 */
export function podiumRows(podiums: Podium[], dateLabel: (competitionId: string, startDate: string) => string): PodiumRow[] {
  const rows = new Map<string, PodiumRow & { podiums: Podium[] }>();
  for (const podium of podiums) {
    const { result } = podium;
    const row = rows.get(result.competition_id) ?? {
      competitionId: result.competition_id,
      competitionName: result.competition_short_name,
      dateLabel: dateLabel(result.competition_id, result.competition_start_date),
      year: result.competition_start_date.slice(0, 4),
      medals: [],
      podiums: [],
    };
    row.podiums.push(podium);
    rows.set(result.competition_id, row);
  }

  return [...rows.values()].map(({ podiums: list, ...row }) => ({ ...row, medals: podiumItems(list) }));
}
