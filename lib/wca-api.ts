/**
 * WCA public API v0 client.
 * Route map: https://github.com/thewca/worldcubeassociation.org/blob/main/config/routes.rb
 * Docs: https://www.worldcubeassociation.org/help/api
 */

export const WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0";

export const WCA_HEADERS = {
  "User-Agent": "bengottschalk.com/1.0 (bgottschalk@worldcubeassociation.org)",
  Accept: "application/json",
};

export type WcaFetchParams = Record<string, string | number | boolean | undefined>;

export async function wcaFetch<T>(
  path: string,
  options?: { revalidate?: number; params?: WcaFetchParams }
): Promise<T | null> {
  const url = new URL(`${WCA_API_BASE}${path.startsWith("/") ? path : `/${path}`}`);

  if (options?.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: WCA_HEADERS,
      next: { revalidate: options?.revalidate ?? 43200 },
    });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`WCA API ${path}:`, error);
    return null;
  }
}

export function getPerson(wcaId: string): Promise<any> {
  return wcaFetch<any>(`/persons/${wcaId}`, { revalidate: 86400 });
}

export function getPersonCompetitions(wcaId: string) {
  return wcaFetch<unknown[]>(`/persons/${wcaId}/competitions`, { revalidate: 43200 });
}

export function getPersonRecords(wcaId: string) {
  return wcaFetch<PersonRecord | PersonRecord[]>(`/persons/${wcaId}/records`, {
    revalidate: 86400,
  });
}

export interface PersonRecord {
  wca_id: string;
  name: string;
  event_id: string;
  best: number;
  average?: number | null;
  regional_single_record?: string | null;
  regional_average_record?: string | null;
  competition_id?: string;
  attempts?: number[];
}

export type WcaUserPayload = {
  user?: Record<string, unknown>;
  upcoming_competitions?: unknown[];
  ongoing_competitions?: unknown[];
};

export function getUser(
  wcaId: string,
  options?: { upcomingCompetitions?: boolean; ongoingCompetitions?: boolean }
): Promise<WcaUserPayload | null> {
  return wcaFetch<WcaUserPayload>(`/users/${wcaId}`, {
    params: {
      upcoming_competitions: options?.upcomingCompetitions ?? true,
      ongoing_competitions: options?.ongoingCompetitions ?? true,
    },
    revalidate: 43200,
  });
}

export interface CompetitionSearchHit {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  city?: string;
  country_iso2?: string;
  date_range?: string;
  url?: string;
  event_ids?: string[];
  registration_open?: string;
  registration_close?: string;
}

export function searchCompetitions(query: string, limit = 10) {
  return wcaFetch<{ result: CompetitionSearchHit[] }>("/search/competitions", {
    params: { q: query, limit },
    revalidate: 3600,
  });
}

export interface CompetitionDetail {
  id: string;
  name: string;
  start_date: string;
  end_date?: string;
  city?: string;
  venue?: string;
  url?: string;
  date_range?: string;
  registration_open?: string;
  registration_close?: string;
  competitor_limit?: number;
  currency_code?: string;
  base_entry_fee_lowest_denomination?: number;
  event_ids?: string[];
}

export interface ScheduleActivity {
  id: number;
  name: string;
  activityCode: string;
  startTime?: string;
  endTime?: string;
  childActivities?: ScheduleActivity[];
}

export interface CompetitionSchedule {
  startDate?: string;
  numberOfDays?: number;
  venues?: {
    name: string;
    timezone?: string;
    rooms?: { name: string; activities?: ScheduleActivity[] }[];
  }[];
}

export function getCompetition(competitionId: string) {
  return wcaFetch<CompetitionDetail>(`/competitions/${competitionId}`, { revalidate: 3600 });
}

export function getCompetitionSchedule(competitionId: string) {
  return wcaFetch<CompetitionSchedule>(`/competitions/${competitionId}/schedule`, {
    revalidate: 3600,
  });
}

export function getCompetitionEvents(competitionId: string) {
  return wcaFetch<unknown>(`/competitions/${competitionId}/events`, { revalidate: 3600 });
}

export function getCompetitionIndex(limit = 30) {
  return wcaFetch<CompetitionSearchHit[]>("/competition_index", {
    params: { limit },
    revalidate: 3600,
  });
}

export interface WorldRecordsPayload {
  world_records?: Record<string, { single?: number; average?: number | null }>;
}

export function getWorldRecords() {
  return wcaFetch<WorldRecordsPayload>("/records", { revalidate: 3600 });
}

export interface RegionalOrganization {
  name: string;
  website?: string;
  country?: string;
  country_iso2?: string;
  logo_url?: string;
}

export function getRegionalOrganizations() {
  return wcaFetch<RegionalOrganization[]>("/regional-organizations", { revalidate: 86400 });
}

const PNW_SEARCH_QUERIES = ["Oregon", "Washington", "Portland", "Seattle", "Salem", "Vancouver"];

export async function searchPnwCompetitions(limitPerQuery = 8): Promise<CompetitionSearchHit[]> {
  const results = await Promise.all(
    PNW_SEARCH_QUERIES.map((q) => searchCompetitions(q, limitPerQuery))
  );

  const byId = new Map<string, CompetitionSearchHit>();
  const today = new Date().toISOString().split("T")[0];

  for (const payload of results) {
    for (const comp of payload?.result ?? []) {
      if (comp.start_date >= today && !byId.has(comp.id)) {
        byId.set(comp.id, comp);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.start_date.localeCompare(b.start_date));
}

export function normalizePersonRecords(
  data: PersonRecord | PersonRecord[] | null
): PersonRecord[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

export function flattenScheduleActivities(schedule: CompetitionSchedule | null): ScheduleActivity[] {
  if (!schedule?.venues) return [];

  const activities: ScheduleActivity[] = [];
  for (const venue of schedule.venues) {
    for (const room of venue.rooms ?? []) {
      for (const activity of room.activities ?? []) {
        activities.push(activity);
      }
    }
  }

  return activities.sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? ""));
}

export function formatRegistrationWindow(comp: CompetitionDetail): string | null {
  if (!comp.registration_open || !comp.registration_close) return null;
  const open = new Date(comp.registration_open).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const close = new Date(comp.registration_close).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${open} – ${close}`;
}
