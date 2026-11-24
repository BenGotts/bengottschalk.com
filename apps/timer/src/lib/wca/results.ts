// Competition attempts in the timer. Official results are imported by the
// server (src/server/wca.ts) straight into the account, and reach this device
// with the next sync; this device only asks the server to import when due.
// While one of the person's competitions is on, the browser follows WCA Live
// itself and saves those attempts as live solves until the official ones arrive.

import { z } from "zod";
import { competitionInfo, competitionSolveChanged, liveSolves } from "@bengottschalk/timer-core/competition";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { db, ensureMainSession, getMeta, setMeta } from "@/lib/db";
import { syncNow } from "@/lib/sync";
import { fetchLiveResults, findLivePerson } from "./live";
import { ScramblesSchema, WcifSchema, type Wcif } from "./schemas";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
/** The server fetches a competition's schedule at most every 30 minutes while it's on, so there's no point asking more often. */
const LIVE_SCHEDULE_MAX_AGE_MS = 30 * MINUTE_MS;

/** GETs or POSTs one of the timer's own /api/wca routes and checks the answer's shape. */
async function api<S extends z.ZodType>(path: string, schema: S, body?: unknown): Promise<z.output<S>> {
  const response = await fetch(path, body === undefined ? undefined : {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = z.object({ error: z.string() }).safeParse(json);
    throw new Error(message.success ? message.data.error : `The timer's server returned ${response.status}.`);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new Error("Unexpected answer from the timer's server.");
  return parsed.data;
}

const ImportSchema = z.object({ done: z.number(), total: z.number(), remaining: z.number(), refreshedAt: z.number(), saved: z.number() });

export interface RefreshProgress {
  done: number;
  total: number;
}

/**
 * Asks the server to import official results (it decides whether they're
 * due, unless `force`), calling again while competitions are still waiting
 * for their schedules, then syncs so the new attempts arrive here.
 */
export async function importOfficialResults(wcaId: string, force: boolean, onProgress?: (progress: RefreshProgress) => void): Promise<void> {
  let result = await api("/api/wca/results", ImportSchema, { force });
  let saved = result.saved;
  while (result.remaining > 0) {
    onProgress?.({ done: result.done, total: result.total });
    const next = await api("/api/wca/results", ImportSchema, {});
    saved += next.saved;
    const stuck = next.remaining >= result.remaining;
    result = next;
    if (stuck) break; // The WCA isn't answering; the server carries on tomorrow.
  }
  await setMeta(`wca:refreshedAt:${wcaId}`, result.refreshedAt);
  if (saved > 0) await syncNow();
}

/** When the server last fetched official results for this WCA ID (ms), or 0. */
export const lastRefreshedAt = (wcaId: string) => getMeta<number>(`wca:refreshedAt:${wcaId}`, 0);

const localIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const CompetitionsSchema = z.object({ competitions: z.array(z.object({ id: z.string(), start_date: z.string(), end_date: z.string() })) });

/** The person's competitions that are on today (by local date, with a day's slack for time zones). */
export async function competitionsToday(): Promise<string[]> {
  const { competitions } = await api("/api/wca/competitions", CompetitionsSchema);
  const yesterday = localIsoDate(new Date(Date.now() - DAY_MS));
  const tomorrow = localIsoDate(new Date(Date.now() + DAY_MS));
  return competitions.filter((c) => c.start_date <= tomorrow && c.end_date >= yesterday).map((c) => c.id);
}

/** A competition's schedule with this person's assignments, kept here for half an hour. */
async function competitionSchedule(competitionId: string): Promise<Wcif | null> {
  const key = `wca:schedule:${competitionId}`;
  const saved = await getMeta<{ fetchedAt: number; wcif: unknown } | null>(key, null);
  if (saved && Date.now() - saved.fetchedAt < LIVE_SCHEDULE_MAX_AGE_MS) return WcifSchema.nullable().catch(null).parse(saved.wcif);
  try {
    const { wcif } = await api(`/api/wca/schedule?competitionId=${encodeURIComponent(competitionId)}`, z.object({ wcif: WcifSchema.nullable() }));
    await setMeta(key, { fetchedAt: Date.now(), wcif });
    return wcif;
  } catch {
    return saved ? WcifSchema.nullable().catch(null).parse(saved.wcif) : null;
  }
}

/**
 * Saves fresh live attempts, only where something changed. Keeps what the
 * person added (a scramble, a comment) and never overwrites an official attempt.
 */
async function saveLiveSolves(fresh: Solve[]): Promise<number> {
  if (fresh.length === 0) return 0;
  const existing = await db.solves.bulkGet(fresh.map((s) => s.id));
  const now = Date.now();
  const changed: Solve[] = [];
  fresh.forEach((solve, i) => {
    const stored = existing[i];
    if (stored && stored.competition?.status === "official") return;
    if (stored && !competitionSolveChanged(stored, solve)) return;
    changed.push({ ...solve, scramble: stored?.scramble || solve.scramble, comment: stored?.comment ?? "", createdAt: stored?.createdAt ?? now, updatedAt: now });
  });
  for (const eventId of new Set(changed.map((s) => s.eventId))) await ensureMainSession(eventId);
  await db.solves.bulkPut(changed);
  return changed.length;
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
  const wcif = await competitionSchedule(competitionId);
  const info = competitionInfo(wcif, wcaId, { name: wcif?.name ?? competitionId, startDate: wcif?.schedule.startDate ?? localIsoDate(new Date()) });
  return { saved: await saveLiveSolves(liveSolves(competitionId, live, info, Date.now())) };
}

/**
 * Fills in scrambles for a competition's attempts, where the WCA says which
 * they were: a round with a single scramble set (attempt k used scramble k).
 * With several sets, the WCA doesn't say which set a competitor had, so those
 * stay blank. Asked for once per competition.
 */
export async function loadCompetitionScrambles(competitionId: string): Promise<number> {
  const key = `wca:scrambles:${competitionId}`;
  if (await getMeta<boolean>(key, false)) return 0;
  const { scrambles } = await api(`/api/wca/scrambles?competitionId=${encodeURIComponent(competitionId)}`, z.object({ scrambles: ScramblesSchema }));
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
  if (scrambles.length > 0) await setMeta(key, true);
  return filled;
}
