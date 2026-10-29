import { isMultiLocation, type HistoryEntry } from "./competitions";

type Place = Pick<HistoryEntry, "city" | "country_iso2">;

/**
 * The 50 states on a tile grid (columns 0–10, rows 0–7), roughly where they
 * sit on a map. DC isn't a state, so it doesn't count towards the goal.
 */
export const US_STATES = [
  { code: "AK", name: "Alaska", col: 0, row: 0 },
  { code: "ME", name: "Maine", col: 10, row: 0 },
  { code: "WI", name: "Wisconsin", col: 5, row: 1 },
  { code: "VT", name: "Vermont", col: 9, row: 1 },
  { code: "NH", name: "New Hampshire", col: 10, row: 1 },
  { code: "WA", name: "Washington", col: 0, row: 2 },
  { code: "ID", name: "Idaho", col: 1, row: 2 },
  { code: "MT", name: "Montana", col: 2, row: 2 },
  { code: "ND", name: "North Dakota", col: 3, row: 2 },
  { code: "MN", name: "Minnesota", col: 4, row: 2 },
  { code: "IL", name: "Illinois", col: 5, row: 2 },
  { code: "MI", name: "Michigan", col: 6, row: 2 },
  { code: "NY", name: "New York", col: 8, row: 2 },
  { code: "MA", name: "Massachusetts", col: 9, row: 2 },
  { code: "OR", name: "Oregon", col: 0, row: 3 },
  { code: "NV", name: "Nevada", col: 1, row: 3 },
  { code: "WY", name: "Wyoming", col: 2, row: 3 },
  { code: "SD", name: "South Dakota", col: 3, row: 3 },
  { code: "IA", name: "Iowa", col: 4, row: 3 },
  { code: "IN", name: "Indiana", col: 5, row: 3 },
  { code: "OH", name: "Ohio", col: 6, row: 3 },
  { code: "PA", name: "Pennsylvania", col: 7, row: 3 },
  { code: "NJ", name: "New Jersey", col: 8, row: 3 },
  { code: "CT", name: "Connecticut", col: 9, row: 3 },
  { code: "RI", name: "Rhode Island", col: 10, row: 3 },
  { code: "CA", name: "California", col: 0, row: 4 },
  { code: "UT", name: "Utah", col: 1, row: 4 },
  { code: "CO", name: "Colorado", col: 2, row: 4 },
  { code: "NE", name: "Nebraska", col: 3, row: 4 },
  { code: "MO", name: "Missouri", col: 4, row: 4 },
  { code: "KY", name: "Kentucky", col: 5, row: 4 },
  { code: "WV", name: "West Virginia", col: 6, row: 4 },
  { code: "VA", name: "Virginia", col: 7, row: 4 },
  { code: "MD", name: "Maryland", col: 8, row: 4 },
  { code: "DE", name: "Delaware", col: 9, row: 4 },
  { code: "AZ", name: "Arizona", col: 1, row: 5 },
  { code: "NM", name: "New Mexico", col: 2, row: 5 },
  { code: "KS", name: "Kansas", col: 3, row: 5 },
  { code: "AR", name: "Arkansas", col: 4, row: 5 },
  { code: "TN", name: "Tennessee", col: 5, row: 5 },
  { code: "NC", name: "North Carolina", col: 6, row: 5 },
  { code: "SC", name: "South Carolina", col: 7, row: 5 },
  { code: "OK", name: "Oklahoma", col: 3, row: 6 },
  { code: "LA", name: "Louisiana", col: 4, row: 6 },
  { code: "MS", name: "Mississippi", col: 5, row: 6 },
  { code: "AL", name: "Alabama", col: 6, row: 6 },
  { code: "GA", name: "Georgia", col: 7, row: 6 },
  { code: "HI", name: "Hawaii", col: 0, row: 7 },
  { code: "TX", name: "Texas", col: 3, row: 7 },
  { code: "FL", name: "Florida", col: 8, row: 7 },
] as const;

const STATE_BY_NAME = new Map<string, (typeof US_STATES)[number]>(US_STATES.map((state) => [state.name, state]));

/** The state's two-letter code, from a WCA city like "Portland, Oregon". Null outside the 50 states. */
export function usStateCode(place: Place): string | null {
  if (place.country_iso2 !== "US") return null;
  const name = place.city.split(", ").at(-1);
  return (name && STATE_BY_NAME.get(name)?.code) ?? null;
}

/**
 * Where a place stands for the goal: competed there, only delegated there
 * (which doesn't count), registered for an upcoming competition there, or not yet.
 */
export type GoalStatus = "competed" | "delegated" | "upcoming" | "none";

export interface GoalPlace {
  status: GoalStatus;
  /** The first competition that earned the status (the next one, for upcoming). */
  competition: { id: string; name: string; start_date: string } | null;
  /** Competitions there, competed in or delegated. */
  count: number;
}

const RANK: Record<GoalStatus, number> = { competed: 3, delegated: 2, upcoming: 1, none: 0 };

/**
 * Progress towards competing everywhere, keyed by `key` (a state or country
 * code). Each place keeps its best status and the earliest competition that
 * earned it. Upcoming competitions only mark places with no past ones.
 */
function goalPlaces(
  history: HistoryEntry[],
  upcoming: (Place & { id: string; name: string; start_date: string })[],
  key: (place: Place) => string | null,
): Map<string, GoalPlace> {
  const places = new Map<string, GoalPlace>();
  const consider = (code: string, status: GoalStatus, competition: GoalPlace["competition"], counts: boolean) => {
    const place = places.get(code) ?? { status: "none", competition: null, count: 0 };
    if (counts) place.count++;
    const better = RANK[status] > RANK[place.status];
    const earlier = RANK[status] === RANK[place.status] && competition && place.competition && competition.start_date < place.competition.start_date;
    if (better || earlier) {
      place.status = status;
      place.competition = competition;
    }
    places.set(code, place);
  };
  for (const entry of history) {
    const code = isMultiLocation(entry) ? null : key(entry);
    if (code) consider(code, entry.competed ? "competed" : "delegated", entry, true);
  }
  for (const competition of upcoming) {
    const code = isMultiLocation(competition) ? null : key(competition);
    if (code) consider(code, "upcoming", competition, false);
  }
  return places;
}

export interface StateGoal extends GoalPlace {
  code: string;
  name: string;
  col: number;
  row: number;
}

/** Every state, with its progress towards the goal. */
export function stateGoals(history: HistoryEntry[], upcoming: Parameters<typeof goalPlaces>[1]): StateGoal[] {
  const places = goalPlaces(history, upcoming, usStateCode);
  return US_STATES.map((state) => ({ ...state, ...(places.get(state.code) ?? { status: "none", competition: null, count: 0 }) }));
}

export interface CountryGoal extends GoalPlace {
  iso2: string;
  name: string;
}

const regionNames = new Intl.DisplayNames("en", { type: "region" });

/** Countries with any competition, competed first, then by when they were first reached. */
export function countryGoals(history: HistoryEntry[], upcoming: Parameters<typeof goalPlaces>[1]): CountryGoal[] {
  const places = goalPlaces(history, upcoming, (place) => place.country_iso2);
  return [...places]
    .map(([iso2, place]) => ({ iso2, name: regionNames.of(iso2) ?? iso2, ...place }))
    .toSorted(
      (a, b) =>
        RANK[b.status] - RANK[a.status] ||
        (a.competition?.start_date ?? "").localeCompare(b.competition?.start_date ?? "") ||
        a.name.localeCompare(b.name),
    );
}
