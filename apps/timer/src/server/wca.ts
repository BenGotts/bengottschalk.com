// The server's copy of each person's WCA data, and the import that turns
// official results into competition solves in their account.
//
// Browsers used to ask the WCA API directly, each device on its own. Now the
// server asks, keeps the answers in Postgres (shared by everyone: a
// competition's schedule is fetched once however many competitors use the
// timer), and writes the solves straight into the `solve` table, from where
// every device pulls them with its next sync.
//
// How often the WCA API is asked:
//   a person's competitions     at most twice a day
//   a person's official results daily while a competition from the last 30
//                               days has no official results yet, otherwise
//                               weekly (or on request, at most every 5 minutes)
//   a competition's schedule    once; every 30 minutes while it's on
//   a competition's scrambles   once they're published
// WCA Live is polled by the browser during a competition, as before.

import { and, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { z } from "zod";
import { competitionInfo, competitionSolveChanged, groupByCompetition, officialSolves } from "@bengottschalk/timer-core/competition";
import { createMainSession } from "@bengottschalk/timer-core/sessions";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { fetchWca, WcaRequestError } from "@/lib/wca/client";
import { PersonResultSchema, ScramblesSchema, UserCompetitionsSchema, WcifSchema, type Wcif } from "@/lib/wca/schemas";
import type { TimerDb } from "./db";
import { solve, sotdMark, timerSession, wcaCompetition, wcaPerson, wcaScrambles } from "./schema";
import { updateFromExcluded } from "./sync";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const COMPETITIONS_MAX_AGE_MS = 12 * HOUR_MS;
const RESULTS_MAX_AGE_MS = 7 * DAY_MS;
const FORCED_REFRESH_MIN_MS = 5 * MINUTE_MS;
/** How long after a competition its results are checked for daily (they're usually posted within a week or two). */
const AWAITING_RESULTS_DAYS = 30;
const LIVE_SCHEDULE_MAX_AGE_MS = 30 * MINUTE_MS;
/** A competition the WCA had no schedule for is asked about again after this long. */
const MISSING_SCHEDULE_MAX_AGE_MS = 7 * DAY_MS;
const MISSING_SCRAMBLES_MAX_AGE_MS = DAY_MS;

export type PersonResult = z.output<typeof PersonResultSchema>;

export interface KnownCompetition {
  id: string;
  start_date: string;
  end_date: string;
}
const KnownCompetitionsSchema = z.array(z.object({ id: z.string(), start_date: z.string(), end_date: z.string() }));

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const time = (date: Date | null | undefined) => date?.getTime() ?? 0;

// ---------------------------------------------------------------------------
// Competition schedules

/** Keeps only what placing attempts needs: the schedule, and competitors with a WCA ID and their assignments. */
function reduceWcif(wcif: Wcif): Wcif {
  return { ...wcif, persons: wcif.persons.filter((p) => p.wcaId).map((p) => ({ wcaId: p.wcaId, assignments: p.assignments })) };
}

/** A schedule reduced to one competitor (what the browser needs). */
export const wcifForPerson = (wcif: Wcif, wcaId: string): Wcif => ({ ...wcif, persons: wcif.persons.filter((p) => p.wcaId === wcaId) });

/** Whether the competition is over (a day's slack for time zones), so its schedule won't change. */
function scheduleSettled(wcif: Wcif, now: number): boolean {
  const end = Date.parse(`${wcif.schedule.startDate}T00:00:00Z`) + (wcif.schedule.numberOfDays ?? 1) * DAY_MS;
  return now > end + DAY_MS;
}

async function fetchSchedule(db: TimerDb, competitionId: string, now: number): Promise<Wcif | null> {
  let wcif: Wcif | null;
  try {
    wcif = reduceWcif(await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/wcif/public`, WcifSchema));
  } catch (error) {
    if (!(error instanceof WcaRequestError && error.status === 404)) throw error;
    wcif = null;
  }
  const row = { id: competitionId, wcif, fetchedAt: new Date(now) };
  await db.insert(wcaCompetition).values(row).onConflictDoUpdate({ target: wcaCompetition.id, set: { wcif, fetchedAt: row.fetchedAt } });
  return wcif;
}

const parseWcif = (value: unknown): Wcif | null => WcifSchema.nullable().catch(null).parse(value);

/**
 * A competition's schedule (null when the WCA has none). Stored schedules are
 * used as they are, except while the competition is on (fetched again every
 * 30 minutes, as groups move around on the day).
 */
export async function competitionSchedule(db: TimerDb, competitionId: string, now = Date.now()): Promise<Wcif | null> {
  const [row] = await db.select().from(wcaCompetition).where(eq(wcaCompetition.id, competitionId));
  if (row) {
    const wcif = parseWcif(row.wcif);
    const age = now - row.fetchedAt.getTime();
    const fresh = wcif ? scheduleSettled(wcif, now) || age < LIVE_SCHEDULE_MAX_AGE_MS : age < MISSING_SCHEDULE_MAX_AGE_MS;
    if (fresh) return wcif;
  }
  try {
    return await fetchSchedule(db, competitionId, now);
  } catch (error) {
    if (row) return parseWcif(row.wcif); // The stored copy will do until the WCA answers.
    throw error;
  }
}

// ---------------------------------------------------------------------------
// A person's competitions

/**
 * The person's ongoing and upcoming competitions, fetched at most twice a
 * day. Finished ones are kept for 30 days after they drop off the WCA's list,
 * so their results are checked for until they're posted.
 */
export async function personCompetitions(db: TimerDb, wcaId: string, now = Date.now()): Promise<KnownCompetition[]> {
  const [row] = await db.select().from(wcaPerson).where(eq(wcaPerson.wcaId, wcaId));
  const saved = KnownCompetitionsSchema.catch([]).parse(row?.competitions ?? []);
  if (row && now - time(row.competitionsFetchedAt) < COMPETITIONS_MAX_AGE_MS) return saved;
  const data = await fetchWca(`/v0/users/${encodeURIComponent(wcaId)}?ongoing_competitions=true&upcoming_competitions=true`, UserCompetitionsSchema);
  const fresh = [...data.ongoing_competitions, ...data.upcoming_competitions].map(({ id, start_date, end_date }) => ({ id, start_date, end_date }));
  const cutoff = isoDate(now - AWAITING_RESULTS_DAYS * DAY_MS);
  const competitions = [...fresh, ...saved.filter((c) => !fresh.some((f) => f.id === c.id) && c.end_date >= cutoff)];
  const fetchedAt = new Date(now);
  await db.insert(wcaPerson).values({ wcaId, competitions, competitionsFetchedAt: fetchedAt })
    .onConflictDoUpdate({ target: wcaPerson.wcaId, set: { competitions, competitionsFetchedAt: fetchedAt } });
  return competitions;
}

// ---------------------------------------------------------------------------
// Scrambles

/** A competition's published scrambles, fetched once they're out. */
export async function competitionScrambles(db: TimerDb, competitionId: string, now = Date.now()): Promise<z.output<typeof ScramblesSchema>> {
  const [row] = await db.select().from(wcaScrambles).where(eq(wcaScrambles.competitionId, competitionId));
  if (row) {
    const saved = ScramblesSchema.catch([]).parse(row.scrambles);
    if (saved.length > 0 || now - row.fetchedAt.getTime() < MISSING_SCRAMBLES_MAX_AGE_MS) return saved;
  }
  const scrambles = await fetchWca(`/v0/competitions/${encodeURIComponent(competitionId)}/scrambles`, ScramblesSchema);
  const fetchedAt = new Date(now);
  await db.insert(wcaScrambles).values({ competitionId, scrambles, fetchedAt })
    .onConflictDoUpdate({ target: wcaScrambles.competitionId, set: { scrambles, fetchedAt } });
  return scrambles;
}

// ---------------------------------------------------------------------------
// Importing official results as solves

/** Whether this user has official attempts from the competition yet. */
async function hasOfficialResults(db: TimerDb, userId: string, competitionId: string): Promise<boolean> {
  const rows = await db.select({ id: solve.id }).from(solve)
    .where(and(eq(solve.userId, userId), like(solve.id, `wca-${competitionId}-%`), sql`${solve.competition}->>'status' = 'official'`))
    .limit(1);
  return rows.length > 0;
}

/**
 * Whether official results are due to be fetched again: daily while a
 * competition that ended in the last 30 days has none here yet, otherwise weekly.
 */
async function resultsDue(db: TimerDb, userId: string, wcaId: string, fetchedAt: number, now: number): Promise<boolean> {
  const age = now - fetchedAt;
  if (age > RESULTS_MAX_AGE_MS) return true;
  if (age < DAY_MS) return false;
  const today = isoDate(now);
  for (const competition of await personCompetitions(db, wcaId, now)) {
    if (competition.end_date < today && !(await hasOfficialResults(db, userId, competition.id))) return true;
  }
  return false;
}

const rowAsSolve = ({ userId: _userId, seq: _seq, ...record }: typeof solve.$inferSelect): Solve => record;

/**
 * Writes one competition's official attempts into the user's account, the
 * way the browser used to: only rows that changed, keeping a scramble or
 * comment the person added. Live attempts the official results don't cover
 * are removed, and a Solve of the Day mark on one moves to the official
 * attempt of the same event, round and attempt. Every write takes a new
 * change cursor, so devices pull it with their next sync.
 */
async function saveCompetition(db: TimerDb, userId: string, competitionId: string, fresh: Solve[], now: number): Promise<number> {
  return db.transaction(async (tx) => {
    // The same lock as a sync, so change cursors stay in order (see sync.ts).
    await tx.execute(sql`select 1 from "user" where id = ${userId} for update`);
    const stored = new Map<string, Solve>();
    const ids = fresh.map((s) => s.id);
    for (let i = 0; i < ids.length; i += 500) {
      const rows = await tx.select().from(solve).where(and(eq(solve.userId, userId), inArray(solve.id, ids.slice(i, i + 500))));
      for (const row of rows) stored.set(row.id, rowAsSolve(row));
    }
    const changed: Solve[] = [];
    for (const solveNow of fresh) {
      const before = stored.get(solveNow.id);
      if (before && !competitionSolveChanged(before, solveNow)) continue;
      changed.push({ ...solveNow, scramble: before?.scramble || solveNow.scramble, comment: before?.comment ?? "", createdAt: before?.createdAt ?? now, updatedAt: now });
    }
    if (changed.length > 0) {
      const sessions = [...new Set(changed.map((s) => s.eventId))].map((eventId) => ({ ...createMainSession(eventId, now), userId }));
      await tx.insert(timerSession).values(sessions).onConflictDoNothing();
      for (let i = 0; i < changed.length; i += 200) {
        await tx.insert(solve).values(changed.slice(i, i + 200).map((s) => ({ ...s, userId })))
          .onConflictDoUpdate({ target: [solve.userId, solve.id], set: updateFromExcluded(solve, ["userId", "id"]) });
      }
    }

    const officialIds = new Set(ids);
    const leftovers = (await tx.select().from(solve)
      .where(and(eq(solve.userId, userId), like(solve.id, `wca-${competitionId}-%`), isNull(solve.deletedAt))))
      .filter((s) => s.competition?.competitionId === competitionId && s.competition.status === "live" && !officialIds.has(s.id));
    for (const live of leftovers) {
      await tx.update(solve).set({ deletedAt: now, updatedAt: now, seq: sql`nextval('sync_seq')` })
        .where(and(eq(solve.userId, userId), eq(solve.id, live.id)));
      const match = fresh.find((s) => s.eventId === live.eventId && s.competition?.attempt === live.competition?.attempt && s.competition?.roundNumber === live.competition?.roundNumber);
      await tx.update(sotdMark)
        .set(match ? { solveId: match.id, deletedAt: null, updatedAt: now, seq: sql`nextval('sync_seq')` } : { deletedAt: now, updatedAt: now, seq: sql`nextval('sync_seq')` })
        .where(and(eq(sotdMark.userId, userId), eq(sotdMark.solveId, live.id)));
    }
    return changed.length;
  });
}

export interface ImportResult {
  /** Competitions with their attempts in the account. */
  done: number;
  total: number;
  /** Competitions still waiting for their schedule; call again to continue. */
  remaining: number;
  /** When official results were last fetched (ms), or 0. */
  refreshedAt: number;
  /** Solves written by this call. */
  saved: number;
}

export interface ImportOptions {
  /** Fetch results now even if not due (at most every 5 minutes). */
  force?: boolean;
  /** Stop fetching schedules after about this long; the rest wait for the next call. */
  budgetMs?: number;
  now?: number;
}

/**
 * Brings the user's official results into their account. Results are fetched
 * when due; each competition's schedule (used to place attempts in time) is
 * fetched once, newest competition first, until the time budget runs out.
 * Competitions still without a schedule come in on later calls.
 */
export async function importCompetitionResults(db: TimerDb, userId: string, wcaId: string, options: ImportOptions = {}): Promise<ImportResult> {
  const started = Date.now();
  const now = options.now ?? started;
  const budgetMs = options.budgetMs ?? 45_000;
  const [person] = await db.select().from(wcaPerson).where(eq(wcaPerson.wcaId, wcaId));
  const lastFetched = time(person?.resultsFetchedAt);

  const fetchResults = options.force
    ? now - lastFetched >= FORCED_REFRESH_MIN_MS
    : await resultsDue(db, userId, wcaId, lastFetched, now);
  const results = fetchResults
    ? await fetchWca(`/v1/persons/${encodeURIComponent(wcaId)}/results`, z.array(PersonResultSchema))
    : z.array(PersonResultSchema).catch([]).parse(person?.results ?? []);

  const competitions = [...groupByCompetition(results)]
    .toSorted(([, a], [, b]) => b[0].competition_start_date.localeCompare(a[0].competition_start_date));
  const ids = competitions.map(([id]) => id);
  const scheduled = new Map<string, Wcif | null>();
  for (let i = 0; i < ids.length; i += 500) {
    for (const row of await db.select().from(wcaCompetition).where(inArray(wcaCompetition.id, ids.slice(i, i + 500)))) {
      scheduled.set(row.id, parseWcif(row.wcif));
    }
  }

  // With fresh results, every competition is written again (only changed rows are);
  // otherwise only competitions whose schedule arrives now.
  const toSave = new Set(fetchResults ? ids.filter((id) => scheduled.has(id)) : []);
  for (const id of ids) {
    if (scheduled.has(id)) continue;
    if (Date.now() - started > budgetMs) break;
    try {
      scheduled.set(id, await fetchSchedule(db, id, now));
      toSave.add(id);
    } catch {
      break; // The WCA is busy or unreachable: carry on next time.
    }
  }

  let saved = 0;
  for (const [id, rows] of competitions) {
    if (!toSave.has(id)) continue;
    const info = competitionInfo(scheduled.get(id) ?? null, wcaId, { name: rows[0].competition_short_name, startDate: rows[0].competition_start_date });
    saved += await saveCompetition(db, userId, id, officialSolves(rows, info, now), now);
  }

  let refreshedAt = lastFetched;
  if (fetchResults) {
    // Recorded last, so results are only counted as fetched once they're saved.
    refreshedAt = now;
    await db.insert(wcaPerson).values({ wcaId, results, resultsFetchedAt: new Date(now) })
      .onConflictDoUpdate({ target: wcaPerson.wcaId, set: { results, resultsFetchedAt: new Date(now) } });
  }
  const remaining = ids.filter((id) => !scheduled.has(id)).length;
  return { done: ids.length - remaining, total: ids.length, remaining, refreshedAt, saved };
}
