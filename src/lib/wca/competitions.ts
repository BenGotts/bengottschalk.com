import type { Competition, PastCompetition, UserCompetitions } from "./schemas";

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

type CompetitionBase = Omit<PastCompetition, "website" | "results_posted_at">;

export interface HistoryEntry extends CompetitionBase {
  competed: boolean;
  delegated: boolean;
  resultsPosted: boolean;
}

/**
 * Every finished competition the person competed in or delegated, newest
 * first. `persons/{id}/competitions` only lists competitions with results for
 * the person, so delegate-only competitions come from the delegate search.
 */
export function buildCompetitionHistory(
  competed: PastCompetition[],
  delegated: Competition[],
  today: string,
): HistoryEntry[] {
  const byId = new Map<string, HistoryEntry>();
  const add = (competition: PastCompetition | Competition, role: "competed" | "delegated") => {
    if (competition.cancelled_at !== null || competition.end_date >= today) return;
    const existing = byId.get(competition.id);
    if (existing) {
      existing[role] = true;
      return;
    }
    byId.set(competition.id, {
      id: competition.id,
      name: competition.name,
      short_name: competition.short_name,
      start_date: competition.start_date,
      end_date: competition.end_date,
      url: competition.url,
      city: competition.city,
      venue: competition.venue,
      country_iso2: competition.country_iso2,
      latitude_degrees: competition.latitude_degrees,
      longitude_degrees: competition.longitude_degrees,
      cancelled_at: competition.cancelled_at,
      competed: role === "competed",
      delegated: role === "delegated",
      resultsPosted: competition.results_posted_at !== null,
    });
  };
  for (const competition of competed) add(competition, "competed");
  for (const competition of delegated) add(competition, "delegated");

  return [...byId.values()].toSorted(
    (a, b) => b.start_date.localeCompare(a.start_date) || a.name.localeCompare(b.name),
  );
}

export interface HistoryStats {
  competed: number;
  delegated: number;
  countries: number;
  usStates: number;
}

/**
 * Multi-location competitions (e.g. FMC World, FMC Americas) use WCA region
 * codes like `XW` or `XM` instead of a country, and placeholder coordinates.
 */
export function isMultiLocation(competition: { country_iso2: string }): boolean {
  return /^X[A-Z]$/.test(competition.country_iso2);
}

/** WCA formats US cities as "City, State". */
function usState(entry: Pick<HistoryEntry, "city" | "country_iso2">): string | null {
  if (entry.country_iso2 !== "US") return null;
  const parts = entry.city.split(", ");
  return parts.length > 1 ? parts[parts.length - 1] : null;
}

export function historyStats(history: HistoryEntry[]): HistoryStats {
  const states = new Set(history.map(usState).filter((state) => state !== null));
  return {
    competed: history.filter((entry) => entry.competed).length,
    delegated: history.filter((entry) => entry.delegated).length,
    countries: new Set(history.filter((entry) => !isMultiLocation(entry)).map((entry) => entry.country_iso2)).size,
    usStates: states.size,
  };
}

/** Groups entries by year (`"2026"`), newest year first, keeping entry order. */
export function groupByYear<T extends { start_date: string }>(entries: T[]): { year: string; entries: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const year = entry.start_date.slice(0, 4);
    groups.set(year, [...(groups.get(year) ?? []), entry]);
  }
  return [...groups.entries()]
    .toSorted(([a], [b]) => b.localeCompare(a))
    .map(([year, yearEntries]) => ({ year, entries: yearEntries }));
}

export type MapStatus = "ongoing" | "upcoming" | "past";

export interface MapCompetition {
  id: string;
  name: string;
  url: string;
  startDate: string;
  dateLabel: string;
  status: MapStatus;
}

export interface MapLocation {
  key: string;
  latitude: number;
  longitude: number;
  city: string;
  /** The most relevant status at this venue: ongoing, then upcoming, then past. */
  status: MapStatus;
  competitions: MapCompetition[];
}

const STATUS_RANK: Record<MapStatus, number> = { ongoing: 0, upcoming: 1, past: 2 };

/** The most relevant of several statuses: ongoing, then upcoming, then past. */
export function mostCurrentStatus(statuses: MapStatus[]): MapStatus {
  return statuses.reduce((best, status) => (STATUS_RANK[status] < STATUS_RANK[best] ? status : best), "past");
}

/**
 * Groups competitions at (almost) the same coordinates into one map location.
 * Multi-location competitions are left out: their coordinates aren't real venues.
 */
export function groupMapLocations(
  items: { competition: CompetitionBase & { date_range?: string }; status: MapStatus }[],
): MapLocation[] {
  const locations = new Map<string, MapLocation>();
  for (const { competition, status } of items) {
    if (isMultiLocation(competition)) continue;
    const latitude = Number(competition.latitude_degrees.toFixed(3));
    const longitude = Number(competition.longitude_degrees.toFixed(3));
    const key = `${latitude},${longitude}`;
    const location = locations.get(key) ?? { key, latitude, longitude, city: competition.city, status, competitions: [] };
    location.competitions.push({
      id: competition.id,
      name: competition.name,
      url: competition.url,
      startDate: competition.start_date,
      dateLabel: competition.date_range || competition.start_date,
      status,
    });
    if (STATUS_RANK[status] < STATUS_RANK[location.status]) location.status = status;
    locations.set(key, location);
  }
  for (const location of locations.values()) {
    location.competitions.sort((a, b) => b.startDate.localeCompare(a.startDate));
  }
  return [...locations.values()];
}
