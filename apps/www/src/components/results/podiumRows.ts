import { eventIconClass, eventName, podiumItems, sortEventIds, type Medal, type Podium, type PodiumItem } from "@/lib/wca";

export type { PodiumItem };

/**
 * A milestone a competition reached:
 * - `overall`: every 50th podium in all events
 * - `complete`: 1st, 2nd and 3rd all won in an event
 * - `first-gold`: the first gold in an event, after an earlier podium there
 * - `first`: the first podium in an event
 * - `count`: the 10th, 25th, 50th or 100th podium in an event
 */
export interface Badge {
  key: string;
  kind: "overall" | "complete" | "first-gold" | "first" | "count";
  label: string;
  /** The event's icon; none for overall milestones. */
  iconClass: string | null;
}

export interface PodiumRow {
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  year: string;
  medals: PodiumItem[];
  /** Milestones reached here, most notable first. */
  badges: Badge[];
}

/** Overall milestones come every this many podiums. */
export const OVERALL_EVERY = 50;
/** Podium counts in one event worth a badge. */
export const EVENT_COUNTS = [10, 25, 50, 100];

const KIND_ORDER: Badge["kind"][] = ["overall", "complete", "first-gold", "first", "count"];

/**
 * Milestones across the podiums, oldest competition first, so each badge goes
 * to the competition that reached it. Returns the badges by competition id.
 */
function milestones(oldestFirst: { competitionId: string; podiums: Podium[] }[]): Map<string, Badge[]> {
  const byCompetition = new Map<string, Badge[]>();
  let total = 0;
  const counts = new Map<string, number>();
  const medalsWon = new Map<string, Set<Medal>>();

  for (const { competitionId, podiums } of oldestFirst) {
    const badges: Badge[] = [];
    const before = total;
    total += podiums.length;
    const reached = Math.floor(total / OVERALL_EVERY) * OVERALL_EVERY;
    if (reached > before) badges.push({ key: `overall-${reached}`, kind: "overall", label: `${reached}th podium`, iconClass: null });

    for (const eventId of sortEventIds([...new Set(podiums.map((podium) => podium.result.event_id))])) {
      const here = podiums.filter((podium) => podium.result.event_id === eventId).map((podium) => podium.medal);
      const name = eventName(eventId);
      const iconClass = eventIconClass(eventId);
      const count = counts.get(eventId) ?? 0;
      const won = medalsWon.get(eventId) ?? new Set<Medal>();
      const hadAll = won.size === 3;
      const hadGold = won.has("gold");

      if (count === 0) {
        const label = here.includes("gold") ? `First ${name} podium · gold` : `First ${name} podium`;
        badges.push({ key: `first-${eventId}`, kind: "first", label, iconClass });
      } else if (!hadGold && here.includes("gold")) {
        badges.push({ key: `first-gold-${eventId}`, kind: "first-gold", label: `First ${name} gold`, iconClass });
      }

      for (const medal of here) won.add(medal);
      if (!hadAll && won.size === 3) badges.push({ key: `complete-${eventId}`, kind: "complete", label: `All three in ${name}`, iconClass });

      const after = count + here.length;
      for (const milestone of EVENT_COUNTS.filter((n) => count < n && after >= n)) {
        badges.push({ key: `count-${eventId}-${milestone}`, kind: "count", label: `${milestone} ${name} podiums`, iconClass });
      }

      counts.set(eventId, after);
      medalsWon.set(eventId, won);
    }

    byCompetition.set(competitionId, badges.toSorted((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)));
  }
  return byCompetition;
}

/**
 * Podiums grouped by competition, newest first, formatted on the server so the
 * browser only renders them. Within a competition: golds first, then by event.
 * Each competition carries the milestones it reached.
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

  const groups = [...rows.values()];
  const badges = milestones(groups.toReversed());
  return groups.map(({ podiums: list, ...row }) => ({ ...row, medals: podiumItems(list), badges: badges.get(row.competitionId) ?? [] }));
}
