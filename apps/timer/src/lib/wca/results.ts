// Brings a person's WCA competition attempts into the timer as solves in each
// event's main session: official results from the WCA API, and WCA Live's
// while one of their competitions is on.

import { z } from "zod";
import {
  competitionInfo, competitionSolveChanged, groupByCompetition, liveSolves, officialSolves,
  type CompetitionInfo,
} from "@bengottschalk/timer-core/competition";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { db, ensureMainSession, getMeta, setMeta } from "@/lib/db";
import { fetchWca, WcaRequestError } from "./client";
import { fetchLiveResults, findLivePerson } from "./live";
import { PersonResultSchema, ScramblesSchema, UserCompetitionsSchema, WcifSchema, type Wcif } from "./schemas";

// How often each WCA request is made (all saved on this device, and shared by its tabs):
//   your competitions (to know when one is on)   twice a day
//   your official results                         daily while a recent competition's results
//                                                 aren't posted yet, otherwise weekly
//   a competition's schedule                      once; every 30 minutes while it's on
// plus WCA Live (not the WCA API) once a minute while a competition is on.

const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const COMPETITIONS_MAX_AGE_MS = 12 * HOUR_MS;
const RESULTS_MAX_AGE_MS = 7 * DAY_MS;
/** How long after a competition its results are checked for daily (they're usually posted within a week or two). */
const AWAITING_RESULTS_DAYS = 30;
const LIVE_SCHEDULE_MAX_AGE_MS = 30 * 60_000;

/**
 * A competition's schedule, reduced to this person, saved on this device.
 * Fetched again only when older than `maxAgeMs` (never, by default). `null`
 * when the WCA has none.
 */
async function competitionSchedule(competitionId: string, wcaId: string, maxAgeMs = Infinity): Promise<Wcif | null> {
  const key = `wca:wcif:${competitionId}`;
  const fetchedAtKey = `wca:wcif-at:${competitionId}`;
  const saved = await db.meta.get(key);
  if (saved && Date.now() - (await getMeta<number>(fetchedAtKey, 0)) <= maxAgeMs) {
    return WcifSchema.nullable().catch(null).parse(saved.value);
  }
  let wcif: Wcif | null;
  try {
    const full = await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/wcif/public`, WcifSchema);
    wcif = { ...full, persons: full.persons.filter((p) => p.wcaId === wcaId) };
  } catch (error) {
    if (error instanceof WcaRequestError && error.status === 404) wcif = null;
    else throw error;
  }
  await setMeta(key, wcif);
  await setMeta(fetchedAtKey, Date.now());
  return wcif;
}

/**
 * Saves fresh competition solves, only where something changed. Keeps what
 * the person added (a scramble found later, Solve of the Day marks, which
 * live apart) and never overwrites an official attempt with a live one.
 */
async function saveCompetitionSolves(fresh: Solve[]): Promise<number> {
  if (fresh.length === 0) return 0;
  const existing = await db.solves.bulkGet(fresh.map((s) => s.id));
  const now = Date.now();
  const changed: Solve[] = [];
  fresh.forEach((solve, i) => {
    const stored = existing[i];
    if (stored && stored.competition?.status === "official" && solve.competition?.status === "live") return;
    if (stored && !competitionSolveChanged(stored, solve)) return;
    changed.push({ ...solve, scramble: stored?.scramble || solve.scramble, comment: stored?.comment ?? "", createdAt: stored?.createdAt ?? now, updatedAt: now });
  });
  for (const eventId of new Set(changed.map((s) => s.eventId))) await ensureMainSession(eventId);
  await db.solves.bulkPut(changed);
  return changed.length;
}

/**
 * Once a competition's official results are in, live attempts they don't
 * cover (a round WCA Live named differently, say) are removed. A Solve of the
 * Day mark on one moves to the official attempt of the same event, round and
 * attempt number.
 */
async function retireLiveAttempts(competitionId: string, official: Solve[]): Promise<void> {
  const officialIds = new Set(official.map((s) => s.id));
  const leftovers = (await db.solves.where("id").startsWith(`wca-${competitionId}-`).toArray())
    .filter((s) => s.competition?.competitionId === competitionId && s.competition.status === "live" && !officialIds.has(s.id) && s.deletedAt === null);
  if (leftovers.length === 0) return;
  const now = Date.now();
  await db.transaction("rw", db.solves, db.sotd, async () => {
    for (const live of leftovers) {
      await db.solves.update(live.id, { deletedAt: now, updatedAt: now });
      const match = official.find((s) => s.eventId === live.eventId && s.competition?.attempt === live.competition?.attempt && s.competition?.roundNumber === live.competition?.roundNumber);
      for (const mark of await db.sotd.where("solveId").equals(live.id).toArray()) {
        await db.sotd.put({ ...mark, solveId: match ? match.id : mark.solveId, deletedAt: match ? null : now, updatedAt: now });
      }
    }
  });
}

export interface RefreshProgress {
  done: number;
  total: number;
}

/**
 * Fetches all official results and saves them as solves. Newest competitions
 * go first, so recent attempts show up while older schedules are still
 * loading (each competition's schedule is fetched once, then kept).
 */
export async function refreshOfficialResults(wcaId: string, onProgress?: (progress: RefreshProgress) => void): Promise<{ saved: number }> {
  const results = await fetchWca(`/v1/persons/${encodeURIComponent(wcaId)}/results`, z.array(PersonResultSchema));
  const competitions = [...groupByCompetition(results)].toSorted(([, a], [, b]) => b[0].competition_start_date.localeCompare(a[0].competition_start_date));
  let saved = 0;
  let done = 0;
  onProgress?.({ done, total: competitions.length });
  for (const [competitionId, rows] of competitions) {
    let info: CompetitionInfo;
    try {
      info = competitionInfo(await competitionSchedule(competitionId, wcaId), wcaId, { name: rows[0].competition_short_name, startDate: rows[0].competition_start_date });
    } catch {
      // The schedule can come next time; place the attempts by day for now.
      info = competitionInfo(null, wcaId, { name: rows[0].competition_short_name, startDate: rows[0].competition_start_date });
    }
    const solves = officialSolves(rows, info, Date.now());
    saved += await saveCompetitionSolves(solves);
    await retireLiveAttempts(competitionId, solves);
    onProgress?.({ done: ++done, total: competitions.length });
  }
  await setMeta(`wca:refreshedAt:${wcaId}`, Date.now());
  return { saved };
}

/** When official results were last fetched for this WCA ID (ms), or 0. */
export const lastRefreshedAt = (wcaId: string) => getMeta<number>(`wca:refreshedAt:${wcaId}`, 0);

const localIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isoDaysFromNow = (days: number) => localIsoDate(new Date(Date.now() + days * DAY_MS));

interface KnownCompetition {
  id: string;
  start_date: string;
  end_date: string;
}

/**
 * The person's ongoing and upcoming competitions, fetched at most twice a
 * day. Ones that have finished are kept for a while after they drop off the
 * WCA's list, so results can be checked for until they're posted.
 */
async function personCompetitions(wcaId: string): Promise<KnownCompetition[]> {
  const key = `wca:competitions:${wcaId}`;
  const saved = await getMeta<{ fetchedAt: number; competitions: KnownCompetition[] } | null>(key, null);
  if (saved && Date.now() - saved.fetchedAt < COMPETITIONS_MAX_AGE_MS) return saved.competitions;
  const data = await fetchWca(`/v0/users/${encodeURIComponent(wcaId)}?ongoing_competitions=true&upcoming_competitions=true`, UserCompetitionsSchema);
  const fresh = [...data.ongoing_competitions, ...data.upcoming_competitions].map(({ id, start_date, end_date }) => ({ id, start_date, end_date }));
  const recent = (saved?.competitions ?? []).filter((c) => !fresh.some((f) => f.id === c.id) && c.end_date >= isoDaysFromNow(-AWAITING_RESULTS_DAYS));
  const competitions = [...fresh, ...recent];
  await setMeta(key, { fetchedAt: Date.now(), competitions });
  return competitions;
}

/**
 * Whether to fetch official results again: daily while a competition that
 * ended in the last month has no official results here yet, otherwise weekly.
 */
export async function refreshDue(wcaId: string): Promise<boolean> {
  const age = Date.now() - (await lastRefreshedAt(wcaId));
  if (age > RESULTS_MAX_AGE_MS) return true;
  if (age < DAY_MS) return false;
  const today = localIsoDate(new Date());
  for (const competition of await personCompetitions(wcaId)) {
    if (competition.end_date >= today) continue;
    const posted = await db.solves.where("id").startsWith(`wca-${competition.id}-`).filter((s) => s.competition?.status === "official").first();
    if (!posted) return true;
  }
  return false;
}

/** The person's competitions that are on today (by local date, with a day's slack for time zones). */
export async function competitionsToday(wcaId: string): Promise<string[]> {
  const yesterday = isoDaysFromNow(-1);
  const tomorrow = isoDaysFromNow(1);
  return (await personCompetitions(wcaId)).filter((c) => c.start_date <= tomorrow && c.end_date >= yesterday).map((c) => c.id);
}

/** Fetches WCA Live results for a competition that's on and saves them as live solves. */
export async function refreshLiveResults(competitionId: string, wcaId: string): Promise<{ saved: number }> {
  const personKey = `wca:live-person:${competitionId}:${wcaId}`;
  let personId = await getMeta<string | null>(personKey, null);
  if (!personId) {
    personId = await findLivePerson(competitionId, wcaId);
    if (!personId) return { saved: 0 };
    await setMeta(personKey, personId);
  }
  const live = await fetchLiveResults(personId);
  // The schedule changes on the day (groups move), so it's fetched again every half hour.
  const wcif = await competitionSchedule(competitionId, wcaId, LIVE_SCHEDULE_MAX_AGE_MS)
    .catch(() => competitionSchedule(competitionId, wcaId))
    .catch(() => null);
  const info = competitionInfo(wcif, wcaId, { name: wcif?.name ?? competitionId, startDate: wcif?.schedule.startDate ?? localIsoDate(new Date()) });
  return { saved: await saveCompetitionSolves(liveSolves(competitionId, live, info, Date.now())) };
}

/**
 * Fills in scrambles for a competition's attempts, where the WCA says which
 * they were: a round with a single scramble set (attempt k used scramble k).
 * With several sets, the WCA doesn't say which set a competitor had, so those
 * stay blank. Fetched once per competition.
 */
export async function loadCompetitionScrambles(competitionId: string): Promise<number> {
  const key = `wca:scrambles:${competitionId}`;
  if (await getMeta<boolean>(key, false)) return 0;
  const scrambles = await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/scrambles`, ScramblesSchema);
  const solves = (await db.solves.where("id").startsWith(`wca-${competitionId}-`).toArray())
    .filter((s) => s.competition?.competitionId === competitionId && !s.scramble && s.eventId !== "333mbf");
  let filled = 0;
  const now = Date.now();
  for (const solve of solves) {
    const round = scrambles.filter((s) => s.event_id === solve.eventId && s.round_type_id === solve.competition!.roundTypeId && !s.is_extra);
    const sets = new Set(round.map((s) => s.group_id));
    if (sets.size !== 1) continue;
    const scramble = round.find((s) => s.scramble_num === solve.competition!.attempt)?.scramble;
    if (!scramble) continue;
    await db.solves.update(solve.id, { scramble, updatedAt: now });
    filled++;
  }
  await setMeta(key, true);
  return filled;
}
