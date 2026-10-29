import { isMultiLocation, type HistoryEntry } from "./competitions";

type Place = Pick<HistoryEntry, "city" | "country_iso2">;

/** The 50 states. DC isn't a state, so it doesn't count towards the 50. */
export const US_STATES = [
  { code: "AK", name: "Alaska" },
  { code: "ME", name: "Maine" },
  { code: "WI", name: "Wisconsin" },
  { code: "VT", name: "Vermont" },
  { code: "NH", name: "New Hampshire" },
  { code: "WA", name: "Washington" },
  { code: "ID", name: "Idaho" },
  { code: "MT", name: "Montana" },
  { code: "ND", name: "North Dakota" },
  { code: "MN", name: "Minnesota" },
  { code: "IL", name: "Illinois" },
  { code: "MI", name: "Michigan" },
  { code: "NY", name: "New York" },
  { code: "MA", name: "Massachusetts" },
  { code: "OR", name: "Oregon" },
  { code: "NV", name: "Nevada" },
  { code: "WY", name: "Wyoming" },
  { code: "SD", name: "South Dakota" },
  { code: "IA", name: "Iowa" },
  { code: "IN", name: "Indiana" },
  { code: "OH", name: "Ohio" },
  { code: "PA", name: "Pennsylvania" },
  { code: "NJ", name: "New Jersey" },
  { code: "CT", name: "Connecticut" },
  { code: "RI", name: "Rhode Island" },
  { code: "CA", name: "California" },
  { code: "UT", name: "Utah" },
  { code: "CO", name: "Colorado" },
  { code: "NE", name: "Nebraska" },
  { code: "MO", name: "Missouri" },
  { code: "KY", name: "Kentucky" },
  { code: "WV", name: "West Virginia" },
  { code: "VA", name: "Virginia" },
  { code: "MD", name: "Maryland" },
  { code: "DE", name: "Delaware" },
  { code: "AZ", name: "Arizona" },
  { code: "NM", name: "New Mexico" },
  { code: "KS", name: "Kansas" },
  { code: "AR", name: "Arkansas" },
  { code: "TN", name: "Tennessee" },
  { code: "NC", name: "North Carolina" },
  { code: "SC", name: "South Carolina" },
  { code: "OK", name: "Oklahoma" },
  { code: "LA", name: "Louisiana" },
  { code: "MS", name: "Mississippi" },
  { code: "AL", name: "Alabama" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "TX", name: "Texas" },
  { code: "FL", name: "Florida" },
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
