import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { WCA_ID, WCA_USER_ID } from "@/consts";
import { fail, ok, type Result } from "@/lib/result";
import { fetchWca } from "./client";
import { mergeCompetitions, utcDateString, type CompetitionsOverview } from "./competitions";
import { getPersonSchedule, type PersonSchedule } from "./schedule";
import {
  CompetitionSchema,
  PastCompetitionSchema,
  PersonResultSchema,
  PersonSchema,
  RecordsSchema,
  UserCompetitionsSchema,
  UserRoleSchema,
  WcifSchema,
  type Competition,
  type PastCompetition,
  type Person,
  type PersonResult,
  type Records,
  type UserRole,
} from "./schemas";

// Every function caches its own result. On success the result lives for the
// given profile; on failure it is kept for minutes so the next attempt comes
// soon without hammering the API. All entries share the "wca" tag.

type CacheProfile = "minutes" | "hours" | "days";

// cacheLife's types take one literal profile name per overload.
function cacheFor(profile: CacheProfile): void {
  switch (profile) {
    case "minutes":
      cacheLife("minutes");
      break;
    case "hours":
      cacheLife("hours");
      break;
    case "days":
      cacheLife("days");
      break;
  }
}

function settle<T>(result: Result<T>, profile: CacheProfile): Result<T> {
  cacheFor(result.ok ? profile : "minutes");
  return result;
}

export async function getPerson(wcaId = WCA_ID): Promise<Result<Person>> {
  "use cache";
  cacheTag("wca", `wca-person-${wcaId}`);
  return settle(await fetchWca(`/v0/persons/${wcaId}`, PersonSchema), "hours");
}

/** Ongoing and upcoming competitions, as a competitor or as a delegate. */
export async function getCompetitionsOverview(wcaId = WCA_ID): Promise<Result<CompetitionsOverview>> {
  "use cache";
  cacheTag("wca", `wca-competitions-${wcaId}`);

  const today = utcDateString(new Date());
  const [registered, delegated] = await Promise.all([
    fetchWca(`/v0/users/${wcaId}?upcoming_competitions=true&ongoing_competitions=true`, UserCompetitionsSchema),
    fetchDelegatedCompetitions(wcaId, { ongoingAndFuture: today }),
  ]);

  if (!registered.ok) return settle(registered, "hours");
  // Still show registered competitions if only the delegate lookup failed.
  const overview = mergeCompetitions(registered.data, delegated.ok ? delegated.data : [], today);
  cacheFor(delegated.ok ? "hours" : "minutes");
  return ok(overview);
}

/** Every competition the person has competed in, newest first. */
export async function getPastCompetitions(wcaId = WCA_ID): Promise<Result<PastCompetition[]>> {
  "use cache";
  cacheTag("wca", `wca-past-competitions-${wcaId}`);
  const result = await fetchWca(`/v0/persons/${wcaId}/competitions`, z.array(PastCompetitionSchema));
  return settle(
    result.ok ? ok(result.data.toSorted((a, b) => b.start_date.localeCompare(a.start_date))) : result,
    "days",
  );
}

/** Every competition the person has delegated, past and future. */
export async function getDelegatedCompetitions(wcaId = WCA_ID): Promise<Result<Competition[]>> {
  "use cache";
  cacheTag("wca", `wca-delegated-${wcaId}`);
  return settle(await fetchDelegatedCompetitions(wcaId), "days");
}

/** All results, or one event's results. Oldest first, as the API returns them. */
export async function getResults(eventId?: string, wcaId = WCA_ID): Promise<Result<PersonResult[]>> {
  "use cache";
  cacheTag("wca", `wca-results-${wcaId}`);
  const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
  return settle(await fetchWca(`/v1/persons/${wcaId}/results${query}`, z.array(PersonResultSchema)), "days");
}

/** Results that set a regional record (NR, CR or WR). */
export async function getRegionalRecords(wcaId = WCA_ID): Promise<Result<PersonResult[]>> {
  "use cache";
  cacheTag("wca", `wca-records-${wcaId}`);
  return settle(await fetchWca(`/v1/persons/${wcaId}/records`, z.array(PersonResultSchema)), "days");
}

/** Current world, continental and national records for every event. */
export async function getRecords(): Promise<Result<Records>> {
  "use cache";
  cacheTag("wca", "wca-global-records");
  return settle(await fetchWca("/v0/records", RecordsSchema), "days");
}

export interface DelegateRole {
  region: string;
  status: string;
  since: string;
}

/** The person's current Delegate role, if any. */
export async function getDelegateRole(userId = WCA_USER_ID): Promise<Result<DelegateRole | null>> {
  "use cache";
  cacheTag("wca", `wca-roles-${userId}`);
  const result = await fetchWca(`/v0/user_roles?userId=${userId}&isActive=true`, z.array(UserRoleSchema));
  if (!result.ok) return settle(result, "days");
  return settle(ok(pickDelegateRole(result.data)), "days");
}

/** The person's events, roles and assignments at one competition. */
export async function getCompetitionSchedule(
  competitionId: string,
  wcaId = WCA_ID,
): Promise<Result<PersonSchedule | null>> {
  "use cache";
  cacheTag("wca", `wca-wcif-${competitionId}`);
  // The WCA caches public WCIF for 5 minutes and assignments can change on the day.
  const result = await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/wcif/public`, WcifSchema);
  cacheLife("minutes");
  return result.ok ? ok(getPersonSchedule(result.data, wcaId)) : result;
}

export function pickDelegateRole(roles: UserRole[]): DelegateRole | null {
  const role = roles
    .filter((r) => r.group.group_type === "delegate_regions" && r.end_date === null && r.metadata?.status)
    .toSorted((a, b) => b.start_date.localeCompare(a.start_date))[0];
  return role?.metadata?.status
    ? { region: role.group.name, status: role.metadata.status, since: role.start_date }
    : null;
}

const PAGE_SIZE = 1000; // WCA API maximum

async function fetchDelegatedCompetitions(
  wcaId: string,
  { ongoingAndFuture }: { ongoingAndFuture?: string } = {},
): Promise<Result<Competition[]>> {
  const params = new URLSearchParams({ delegate: wcaId, per_page: String(PAGE_SIZE) });
  if (ongoingAndFuture) params.set("ongoing_and_future", ongoingAndFuture);

  const competitions: Competition[] = [];
  for (let page = 1; ; page++) {
    params.set("page", String(page));
    const result = await fetchWca(`/v0/competitions?${params}`, z.array(CompetitionSchema));
    if (!result.ok) return result;
    competitions.push(...result.data);
    if (result.data.length < PAGE_SIZE) return ok(competitions);
    if (page >= 10) return fail("Too many pages of delegated competitions");
  }
}
