import { isMultiLocation, type HistoryEntry } from "./competitions";

/** Portland, the map's home point, for "farthest from home". */
export const HOME = { name: "Portland", latitude: 45.52, longitude: -122.68 };

const EARTH_RADIUS_MILES = 3958.8;
export const EARTH_CIRCUMFERENCE_MILES = 24_901;

type Point = { latitude: number; longitude: number };

const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in miles (haversine formula). */
export function distanceMiles(a: Point, b: Point): number {
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

const point = (entry: HistoryEntry): Point => ({ latitude: entry.latitude_degrees, longitude: entry.longitude_degrees });

export interface TravelStats {
  /** Sum of the distances from each competition to the next, in date order. */
  totalMiles: number;
  /** Competitions counted (multi-location ones have no real venue). */
  competitions: number;
  farthest: { entry: HistoryEntry; miles: number } | null;
  busiestYear: { year: string; count: number } | null;
  topCity: { city: string; countryIso2: string; count: number } | null;
}

/**
 * Travel between competitions, competed in or delegated. Multi-location
 * competitions (e.g. FMC around the world) are left out, since their
 * coordinates aren't where the person was. Ties keep the earliest.
 */
export function travelStats(history: HistoryEntry[]): TravelStats {
  const visited = history
    .filter((entry) => !isMultiLocation(entry))
    .toSorted((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id));

  let totalMiles = 0;
  let farthest: TravelStats["farthest"] = null;
  const years = new Map<string, number>();
  const cities = new Map<string, { city: string; countryIso2: string; count: number }>();
  visited.forEach((entry, index) => {
    if (index > 0) totalMiles += distanceMiles(point(visited[index - 1]), point(entry));
    const fromHome = distanceMiles(HOME, point(entry));
    if (!farthest || fromHome > farthest.miles) farthest = { entry, miles: fromHome };
    const year = entry.start_date.slice(0, 4);
    years.set(year, (years.get(year) ?? 0) + 1);
    const key = `${entry.city}|${entry.country_iso2}`;
    const city = cities.get(key) ?? { city: entry.city, countryIso2: entry.country_iso2, count: 0 };
    city.count++;
    cities.set(key, city);
  });

  // Maps keep insertion order (oldest first), so `>` keeps the earliest of a tie.
  let busiestYear: TravelStats["busiestYear"] = null;
  for (const [year, count] of years) if (!busiestYear || count > busiestYear.count) busiestYear = { year, count };
  let topCity: TravelStats["topCity"] = null;
  for (const city of cities.values()) if (!topCity || city.count > topCity.count) topCity = city;

  return { totalMiles, competitions: visited.length, farthest, busiestYear, topCity };
}
