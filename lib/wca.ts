// lib/wca.ts
import {
  formatCentiseconds,
  decodeMultiResult,
  formatMultiResult,
  parseActivityCode,
} from "@wca/helpers";

export const MY_WCA_ID = "2016GOTT01";

const WCA_HEADERS = {
  "User-Agent": "bengottschalk.com/1.0 (bgottschalk@worldcubeassociation.org)",
  Accept: "application/json",
};

/**
 * Event Names Map for official WCA events
 */
export const EVENT_NAMES: Record<string, string> = {
  "333": "3x3x3 Cube",
  "222": "2x2x2 Cube",
  "444": "4x4x4 Cube",
  "555": "5x5x5 Cube",
  "666": "6x6x6 Cube",
  "777": "7x7x7 Cube",
  "333bf": "3x3x3 Blindfolded",
  "333fm": "3x3x3 Fewest Moves",
  "333oh": "3x3x3 One-Handed",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4x4x4 Blindfolded",
  "555bf": "5x5x5 Blindfolded",
  "333mbf": "3x3x3 Multi-Blind",
  "333ft": "3x3x3 With Feet",
};

/**
 * Active official WCA event order (excludes 333ft removed in 2020)
 */
export const ACTIVE_EVENT_ORDER = [
  "333",
  "222",
  "444",
  "555",
  "666",
  "777",
  "333bf",
  "333fm",
  "333oh",
  "clock",
  "minx",
  "pyram",
  "skewb",
  "sq1",
  "444bf",
  "555bf",
  "333mbf",
];

/**
 * Historical/Full WCA Event order
 */
export const OFFICIAL_EVENT_ORDER = [...ACTIVE_EVENT_ORDER, "333ft"];

/**
 * Multi-location / virtual competitions to exclude from spatial map views
 */
export const EXCLUDED_MAP_COMP_IDS = new Set([
  "WCAFMC2023",
  "WCAFMC2024",
  "FMCAmericas2018",
  "FMC2019",
  "FMCNorthAmericaWest2019",
  "NorthwestFMCChampionship2024",
]);

/**
 * Formats raw WCA result values into official time strings using @wca/helpers.
 * Handles standard times (centiseconds), FMC (move counts), Multi-Blind (encoded numbers), DNF, DNS.
 */
export function formatWcaResult(
  value?: number | null,
  eventId: string = "333",
  isAverage: boolean = false
): string {
  // 3x3 Multi-Blind has no average
  if (eventId === "333mbf" && isAverage) return "—";

  if (value === undefined || value === null || value <= 0) {
    if (value === -1) return "DNF";
    if (value === -2) return "DNS";
    return "—";
  }

  // Fewest Moves (FMC)
  if (eventId === "333fm") {
    return isAverage ? (value / 100).toFixed(2) : `${value}`;
  }

  // 3x3 Multi-Blind (333mbf)
  if (eventId === "333mbf") {
    return formatMultiResult(decodeMultiResult(value));
  }

  // Standard Centisecond Events
  return formatCentiseconds(value);
}

/**
 * Helper to parse activity codes like "333-r2" into readable text
 */
export function formatActivityCode(activityCode: string): string {
  const parsed = parseActivityCode(activityCode);
  if (!parsed) return activityCode;

  const eventName = EVENT_NAMES[parsed.eventId] || parsed.eventId;
  if (parsed.roundNumber) {
    return `${eventName} (Round ${parsed.roundNumber})`;
  }
  return eventName;
}

/* ==========================================================================
   WCA API Fetching Helpers
   ========================================================================== */

/**
 * Fetch profile data, personal records, and medal counts
 */
export async function getWcaProfile() {
  try {
    const res = await fetch(
      `https://www.worldcubeassociation.org/api/v0/persons/${MY_WCA_ID}`,
      {
        headers: WCA_HEADERS,
        next: { revalidate: 86400 }, // Cache 24h
      }
    );
    return res.ok ? await res.json() : null;
  } catch (error) {
    console.error("Error fetching WCA profile:", error);
    return null;
  }
}

/**
 * Fetch user payload including upcoming competition commitments
 */
export async function getWcaUserData() {
  try {
    const res = await fetch(
      `https://www.worldcubeassociation.org/api/v0/users/${MY_WCA_ID}?upcoming_competitions=true`,
      {
        headers: WCA_HEADERS,
        next: { revalidate: 43200 }, // Cache 12h
      }
    );
    return res.ok ? await res.json() : null;
  } catch (error) {
    console.error("Error fetching WCA user data:", error);
    return null;
  }
}

/**
 * Fetch complete competition history
 */
export async function getWcaCompetitions() {
  try {
    const res = await fetch(
      `https://www.worldcubeassociation.org/api/v0/persons/${MY_WCA_ID}/competitions`,
      {
        headers: WCA_HEADERS,
        next: { revalidate: 43200 }, // Cache 12h
      }
    );
    return res.ok ? await res.json() : [];
  } catch (error) {
    console.error("Error fetching WCA competitions:", error);
    return [];
  }
}

/**
 * Filters past & upcoming competitions safely for Leaflet mapping.
 * Flags upcoming competitions with `isUpcoming: true` for visual differentiation.
 */
export function filterMapCompetitions(
  allComps: any[],
  upcomingComps: any[] = [],
  today: string
) {
  const compMap = new Map<string, any>();

  // Process past competitions
  if (Array.isArray(allComps)) {
    allComps.forEach((comp) => {
      const isPast = comp.start_date < today;
      const hasValidCoords =
        typeof comp.latitude_degrees === "number" &&
        typeof comp.longitude_degrees === "number" &&
        !(comp.latitude_degrees === 0 && comp.longitude_degrees === 0);
      const isSingleCity =
        comp.city && !comp.city.toLowerCase().includes("multiple");
      const isNotExcluded = !EXCLUDED_MAP_COMP_IDS.has(comp.id);

      if (isPast && hasValidCoords && isSingleCity && isNotExcluded) {
        compMap.set(comp.id, {
          id: comp.id,
          name: comp.name,
          cityName: comp.city,
          latitude: comp.latitude_degrees,
          longitude: comp.longitude_degrees,
          date: comp.start_date,
          isUpcoming: false,
        });
      }
    });
  }

  // Process upcoming competitions
  if (Array.isArray(upcomingComps)) {
    upcomingComps.forEach((comp) => {
      const hasValidCoords =
        typeof comp.latitude_degrees === "number" &&
        typeof comp.longitude_degrees === "number" &&
        !(comp.latitude_degrees === 0 && comp.longitude_degrees === 0);
      const isSingleCity =
        comp.city && !comp.city.toLowerCase().includes("multiple");

      if (hasValidCoords && isSingleCity) {
        compMap.set(comp.id, {
          id: comp.id,
          name: comp.name,
          cityName: comp.city,
          latitude: comp.latitude_degrees,
          longitude: comp.longitude_degrees,
          date: comp.date_range || comp.start_date,
          isUpcoming: true,
        });
      }
    });
  }

  return Array.from(compMap.values());
}