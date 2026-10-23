import type { Competition, UserCompetitions } from "./schemas";

export interface CompetitionsOverview {
  ongoing: Competition[];
  upcoming: Competition[];
}

/** Today's date as `YYYY-MM-DD` in UTC, the format WCA competition dates use. */
export function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function byDate(a: Competition, b: Competition): number {
  return a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date);
}

/**
 * Combines the competitions the user is registered for with the ones they
 * delegate. The users endpoint only lists competitions where the person is an
 * accepted competitor, so delegate-only competitions would otherwise be missing.
 * Ongoing means `start_date <= today <= end_date`, matching the WCA's own check.
 */
export function mergeCompetitions(
  registered: UserCompetitions,
  delegated: Competition[],
  today: string,
): CompetitionsOverview {
  const byId = new Map<string, Competition>();
  for (const competition of [
    ...registered.ongoing_competitions,
    ...registered.upcoming_competitions,
    ...delegated,
  ]) {
    if (competition.cancelled_at === null && !byId.has(competition.id)) {
      byId.set(competition.id, competition);
    }
  }

  const ongoing: Competition[] = [];
  const upcoming: Competition[] = [];
  for (const competition of byId.values()) {
    if (competition.end_date < today) continue;
    (competition.start_date <= today ? ongoing : upcoming).push(competition);
  }

  return { ongoing: ongoing.toSorted(byDate), upcoming: upcoming.toSorted(byDate) };
}

export function hasStaffRole(
  competition: Pick<Competition, "delegates" | "organizers">,
  wcaId: string,
): { isDelegate: boolean; isOrganizer: boolean } {
  return {
    isDelegate: competition.delegates.some((person) => person.wca_id === wcaId),
    isOrganizer: competition.organizers.some((person) => person.wca_id === wcaId),
  };
}
