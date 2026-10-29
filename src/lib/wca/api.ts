import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { WCA_ID, WCA_USER_ID } from "@/consts";
import { imageSize, type ImageSize } from "@/lib/imageSize";
import { fail, ok, type Result } from "@/lib/result";
import { fetchWca } from "./client";
import {
  addDays,
  buildCompetitionHistory,
  isNearToday,
  localDateString,
  mergeCompetitions,
  utcDateString,
  type CompetitionsOverview,
  type HistoryEntry,
} from "./competitions";
import { findLivePerson, type LivePerson } from "./live";
import { getPersonSchedule, type PersonSchedule } from "./schedule";
import {
  CompetitionScheduleSchema,
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

export interface Avatar extends ImageSize {
  url: string;
  /** The square the person picked for their WCA thumbnail, in pixels of the photo. */
  crop: { x: number; y: number; size: number } | null;
}

/**
 * The person's WCA profile photo with its size, so it can be shown with the
 * same crop as their WCA thumbnail. `null` without a photo of their own.
 */
export async function getAvatar(wcaId = WCA_ID): Promise<Result<Avatar | null>> {
  "use cache";
  cacheTag("wca", `wca-avatar-${wcaId}`);
  const person = await getPerson(wcaId);
  if (!person.ok) return settle(person, "days");
  const avatar = person.data.person.avatar;
  if (!avatar || avatar.is_default) return settle(ok(null), "days");

  try {
    // The WCA API doesn't give the photo's size, so read it from the file.
    const response = await fetch(avatar.url, { signal: AbortSignal.timeout(15_000) });
    const size = response.ok ? imageSize(new Uint8Array(await response.arrayBuffer())) : null;
    if (!size) return settle(fail(`Couldn't read the avatar's size (${response.status})`), "days");
    const { thumbnail_crop_x: x, thumbnail_crop_y: y, thumbnail_crop_w: w } = avatar;
    const crop = x != null && y != null && w ? { x, y, size: w } : null;
    return settle(ok({ url: avatar.url, ...size, crop }), "days");
  } catch {
    return settle(fail("Avatar request failed"), "days");
  }
}

/** Ongoing and upcoming competitions, as a competitor or as a delegate. */
export async function getCompetitionsOverview(wcaId = WCA_ID): Promise<Result<CompetitionsOverview>> {
  "use cache";
  cacheTag("wca", `wca-competitions-${wcaId}`);

  const now = new Date();
  const utcToday = utcDateString(now);
  const [registered, delegated] = await Promise.all([
    fetchWca(`/v0/users/${wcaId}?upcoming_competitions=true&ongoing_competitions=true`, UserCompetitionsSchema),
    // Shared with the history, so a build or refresh asks the WCA once.
    getDelegatedCompetitions(wcaId),
  ]);

  if (!registered.ok) return settle(registered, "hours");
  // From yesterday (UTC), so a competition still running at its venue after
  // UTC midnight stays in.
  const since = addDays(utcToday, -1);
  const delegatedData = delegated.ok
    ? delegated.data.filter((competition) => competition.end_date >= since)
    : [];

  // Only competitions near today need a venue time zone to classify.
  const near = new Map<string, Competition>();
  for (const competition of [...registered.data.ongoing_competitions, ...registered.data.upcoming_competitions, ...delegatedData]) {
    if (isNearToday(competition, utcToday)) near.set(competition.id, competition);
  }
  const timezones = new Map(
    await Promise.all([...near.keys()].map(async (id) => [id, await getCompetitionTimezone(id)] as const)),
  );
  const todayFor = (competition: Competition) => {
    const timezone = timezones.get(competition.id);
    return timezone?.ok && timezone.data ? localDateString(now, timezone.data) : utcToday;
  };

  // Still show registered competitions if only the delegate lookup failed.
  const overview = mergeCompetitions(registered.data, delegatedData, todayFor);
  // Around a competition day the status can change at any local midnight.
  cacheFor(!delegated.ok || near.size > 0 ? "minutes" : "hours");
  return ok(overview);
}

/** The time zone of a competition's (first) venue, from its public schedule. */
export async function getCompetitionTimezone(competitionId: string): Promise<Result<string | null>> {
  "use cache";
  cacheTag("wca", `wca-timezone-${competitionId}`);
  const result = await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/schedule`, CompetitionScheduleSchema);
  return settle(result.ok ? ok(result.data.venues[0]?.timezone ?? null) : result, "days");
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

/**
 * Competitions the person competed in or delegated that may have finished.
 * Pass the result through `finishedCompetitions` with the overview, which drops
 * the ones still running at their venue.
 */
export async function getCompetitionHistory(
  wcaId = WCA_ID,
): Promise<Result<{ history: HistoryEntry[]; utcToday: string }>> {
  "use cache";
  cacheTag("wca", `wca-history-${wcaId}`);
  const utcToday = utcDateString(new Date());
  const [competed, delegated] = await Promise.all([
    fetchWca(`/v0/persons/${wcaId}/competitions`, z.array(PastCompetitionSchema)),
    getDelegatedCompetitions(wcaId),
  ]);
  if (!competed.ok) return settle(competed, "days");
  if (!delegated.ok) return settle(delegated, "days");
  // Refresh often around a competition so it moves into history soon after it ends.
  const nearCompetition = [...competed.data, ...delegated.data].some((c) => isNearToday(c, utcToday));
  return settle(
    ok({ history: buildCompetitionHistory(competed.data, delegated.data, utcToday), utcToday }),
    nearCompetition ? "minutes" : "days",
  );
}

/**
 * Every competition the person has delegated, past and future. Both the
 * history and the overview use it; hours keeps new assignments showing soon.
 */
export async function getDelegatedCompetitions(wcaId = WCA_ID): Promise<Result<Competition[]>> {
  "use cache";
  cacheTag("wca", `wca-delegated-${wcaId}`);
  return settle(await fetchDelegatedCompetitions(wcaId), "hours");
}

/**
 * All results, or one event's results. Oldest first, as the API returns them.
 * One event's are picked from the cached full list rather than asked for
 * separately, so a build makes one request instead of one per event page.
 */
export async function getResults(eventId?: string, wcaId = WCA_ID): Promise<Result<PersonResult[]>> {
  "use cache";
  cacheTag("wca", `wca-results-${wcaId}`);
  if (eventId) {
    const all = await getResults(undefined, wcaId);
    return settle(all.ok ? ok(all.data.filter((result) => result.event_id === eventId)) : all, "days");
  }
  // Every result in every event is a large, slow response.
  return settle(await fetchWca(`/v1/persons/${wcaId}/results`, z.array(PersonResultSchema), { timeoutMs: 40_000 }), "days");
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

/** The person's WCA Live ids at a competition, for polling live results from the browser. */
export async function getLivePerson(competitionId: string, wcaId = WCA_ID): Promise<Result<LivePerson | null>> {
  "use cache";
  cacheTag("wca", `wca-live-${competitionId}`);
  const result = await findLivePerson(competitionId, wcaId);
  // Competitors are imported into WCA Live shortly before the competition, so keep checking until found.
  return settle(result, result.ok && result.data ? "hours" : "minutes");
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

async function fetchDelegatedCompetitions(wcaId: string): Promise<Result<Competition[]>> {
  const params = new URLSearchParams({ delegate: wcaId, per_page: String(PAGE_SIZE) });

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
