// The sync endpoint's logic: take a device's changes, keep each one only if
// it's newer than the stored copy (the last edit wins), and send back
// everything that changed since the device's cursor.
//
// Each sync runs in one transaction that first locks the user's row, so one
// person's syncs (from several devices) run one at a time. That keeps the
// change cursor safe: no write with a lower cursor can commit after a device
// has read past it.

import { and, asc, eq, getTableColumns, getTableName, gt, inArray, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { TimerSession } from "@bengottschalk/timer-core/sessions";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { SotdMark } from "@bengottschalk/timer-core/sotd";
import type { SyncResponse } from "@bengottschalk/timer-core/sync";
import type { TimerDb } from "./db";
import { solve, sotdMark, timerSession } from "./schema";
import { fromStoredId, solveUuid, toStoredId } from "./solve-key";

const ms = z.number().int().nonnegative();
const nullableMs = ms.nullable();

const sessionRecord = z.object({
  id: z.string().min(1).max(100),
  eventId: z.string().min(1).max(20),
  parentId: z.string().max(100).nullable(),
  name: z.string().max(200),
  goal: z.number().int().positive().nullable(),
  status: z.enum(["active", "merged", "discarded"]),
  createdAt: ms,
  updatedAt: ms,
  mergedAt: nullableMs,
  deletedAt: nullableMs,
});

const solveRecord = z.object({
  id: z.string().min(1).max(200),
  eventId: z.string().min(1).max(20),
  sessionId: z.string().min(1).max(100),
  timeMs: z.number().int().nonnegative(),
  penalty: z.enum(["none", "+2", "dnf"]),
  scramble: z.string().max(20_000),
  comment: z.string().max(5_000),
  startedAt: ms,
  endedAt: nullableMs,
  source: z.enum(["home", "competition"]),
  // Stored as JSON. Unknown fields are kept (not dropped), so new details a
  // later version of the timer adds about competition attempts still sync.
  competition: z.looseObject({
    competitionId: z.string().max(100),
    competitionName: z.string().max(300),
    roundTypeId: z.string().max(10),
    roundNumber: z.number().int().nullable().optional(),
    attempt: z.number().int(),
    status: z.enum(["live", "official"]),
    timeEstimate: z.enum(["entered", "group", "round", "day"]),
    position: z.number().int().nullable().optional(),
    roundAverage: z.number().int().nullable().optional(),
    singleRecord: z.string().max(10).nullable().optional(),
    averageRecord: z.string().max(10).nullable().optional(),
  }).nullable().default(null),
  memoMs: z.number().int().nonnegative().nullable(),
  // `notes` (the attempt's scratch pad) is newer: older versions leave it out.
  fmc: z.object({ solution: z.string().max(2_000), moves: z.number().int().nonnegative(), notes: z.string().max(20_000).optional() }).nullable(),
  multi: z.object({ solved: z.number().int().nonnegative(), attempted: z.number().int().nonnegative() }).nullable(),
  entry: z.enum(["timer", "typed", "stackmat", "import"]),
  // Any short lowercase name, so a method a newer timer adds (new hardware) still syncs.
  // Older versions don't send it: it stays as stored (see KEPT_WHEN_NOT_SENT).
  timing: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/).nullable().optional(),
  createdAt: ms,
  updatedAt: ms,
  deletedAt: nullableMs,
});

const sotdRecord = z.object({
  // Each event has its own Solve of the Day. Versions of the timer from
  // before that don't send it: the server takes the marked solve's event
  // (see withServerEvents).
  eventId: z.string().min(1).max(20).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  solveId: z.string().min(1).max(200),
  updatedAt: ms,
  deletedAt: nullableMs,
});

/** At most this many records of each kind in one request; devices send more in later requests. */
export const MAX_PUSH = 500;
/**
 * At most this many records of each kind in one response, and about this
 * many bytes of JSON in all (Vercel caps a response at 4.5 MB). A new device
 * downloads a big account in a few dozen pages instead of hundreds.
 */
export const MAX_PULL = 5000;
export const MAX_PULL_BYTES = 3_000_000;

export const syncRequestSchema = z.object({
  cursor: z.number().int().nonnegative(),
  changes: z.object({
    sessions: z.array(sessionRecord).max(MAX_PUSH),
    solves: z.array(solveRecord).max(MAX_PUSH),
    sotd: z.array(sotdRecord).max(MAX_PUSH),
  }),
});

export type SyncRequestBody = z.infer<typeof syncRequestSchema>;
export type TimerSyncResponse = SyncResponse<TimerSession, Solve, SotdMark>;

/**
 * Columns added after devices were already syncing. An older version of the
 * timer doesn't send them, so an edit from it keeps the stored value instead
 * of clearing it.
 */
const KEPT_WHEN_NOT_SENT = new Set(["timing"]);

/** `SET col = excluded.col` for every column but the key, plus a new change cursor. */
export function updateFromExcluded(table: PgTable, keys: string[]): Record<string, SQL> {
  const set: Record<string, SQL> = {};
  const tableName = getTableName(table);
  for (const [name, column] of Object.entries(getTableColumns(table))) {
    if (keys.includes(name) || name === "seq") continue;
    set[name] = KEPT_WHEN_NOT_SENT.has(name)
      ? sql.raw(`coalesce(excluded."${column.name}", "${tableName}"."${column.name}")`)
      : sql.raw(`excluded."${column.name}"`);
  }
  set.seq = sql`nextval('sync_seq')`;
  return set;
}

/** Inserts records, or replaces stored ones only where the incoming copy is newer. */
async function upsertNewer(tx: TimerDb, table: typeof timerSession | typeof solve | typeof sotdMark, target: PgColumn[], keys: string[], rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += 200) {
    await tx
      .insert(table)
      // Rows are validated by zod above and match the table's columns.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      .values(rows.slice(i, i + 200) as never)
      .onConflictDoUpdate({
        target,
        set: updateFromExcluded(table, keys),
        // Mirrors `incomingWins` in @bengottschalk/timer-core/sync.
        setWhere: sql`excluded."updated_at" > ${table.updatedAt}`,
      });
  }
}

type IncomingMark = SyncRequestBody["changes"]["sotd"][number];

/**
 * Marks from an older version of the timer carry no event: they take their
 * solve's, as stored (after this request's own solves are saved). A mark
 * whose solve the server doesn't have is left out: it couldn't be shown, and
 * its event (part of its key) can't be known.
 */
async function withServerEvents(tx: TimerDb, userId: string, marks: IncomingMark[]): Promise<SotdMark[]> {
  const missing = [...new Set(marks.filter((m) => m.eventId === undefined).map((m) => m.solveId))];
  const events = new Map<string, string>();
  for (let i = 0; i < missing.length; i += 500) {
    const rows = await tx.select({ id: solve.id, key: solve.key, eventId: solve.eventId }).from(solve)
      .where(and(eq(solve.userId, userId), inArray(solve.id, missing.slice(i, i + 500).map(solveUuid))));
    for (const row of rows) events.set(fromStoredId(row).id, row.eventId);
  }
  return marks.flatMap(({ solveId, eventId = events.get(solveId), ...mark }) => (eventId === undefined ? [] : [{ ...mark, solveId, eventId }]));
}

/** Drops the server-only columns from a stored row. */
function stripServerColumns<T extends { userId: string; seq: number }>({ userId: _userId, seq: _seq, ...record }: T) {
  return record;
}

/** How many of the user's records changed after `cursor` (uses the (user, seq) indexes). */
async function countSince(tx: TimerDb, userId: string, cursor: number): Promise<number> {
  const counts = await Promise.all(
    [timerSession, solve, sotdMark].map((table) =>
      tx.select({ n: sql<number>`count(*)::int` }).from(table).where(and(eq(table.userId, userId), gt(table.seq, cursor)))),
  );
  return counts.reduce((sum, [row]) => sum + (row?.n ?? 0), 0);
}

/** Runs one sync for a signed-in user. (`limits` are for tests.) */
export async function syncForUser(
  db: TimerDb,
  userId: string,
  request: SyncRequestBody,
  limits: { maxRows?: number; maxBytes?: number } = {},
): Promise<TimerSyncResponse> {
  const maxRows = limits.maxRows ?? MAX_PULL;
  const maxBytes = limits.maxBytes ?? MAX_PULL_BYTES;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select 1 from "user" where id = ${userId} for update`);

    const { sessions, solves, sotd } = request.changes;
    await upsertNewer(tx, timerSession, [timerSession.userId, timerSession.id], ["userId", "id"], sessions.map((r) => ({ ...r, userId })));
    await upsertNewer(tx, solve, [solve.userId, solve.id], ["userId", "id"], solves.map((r) => ({ ...r, ...toStoredId(r.id), userId })));
    const marks = await withServerEvents(tx, userId, sotd);
    await upsertNewer(tx, sotdMark, [sotdMark.userId, sotdMark.eventId, sotdMark.date], ["userId", "eventId", "date"], marks.map((r) => ({ ...r, userId })));

    const since = request.cursor;
    const [sessionRows, solveRows, markRows] = await Promise.all([
      tx.select().from(timerSession).where(and(eq(timerSession.userId, userId), gt(timerSession.seq, since))).orderBy(asc(timerSession.seq)).limit(maxRows + 1),
      tx.select().from(solve).where(and(eq(solve.userId, userId), gt(solve.seq, since))).orderBy(asc(solve.seq)).limit(maxRows + 1),
      tx.select().from(sotdMark).where(and(eq(sotdMark.userId, userId), gt(sotdMark.seq, since))).orderBy(asc(sotdMark.seq)).limit(maxRows + 1),
    ]);

    // When a kind has more than fits, only send changes up to the lowest
    // cursor that's complete for every kind, and ask the device to come back.
    let cutoff = Infinity;
    for (const rows of [sessionRows, solveRows, markRows]) {
      if (rows.length > maxRows) cutoff = Math.min(cutoff, rows[maxRows - 1].seq);
    }
    // Keep the response under the size limit too: walk the changes in cursor
    // order and stop before the one that would go over (always sending at least one).
    let bytes = 0;
    const inOrder = [...sessionRows, ...solveRows, ...markRows].filter((row) => row.seq <= cutoff).toSorted((a, b) => a.seq - b.seq);
    for (const [i, row] of inOrder.entries()) {
      bytes += JSON.stringify(row).length;
      if (bytes > maxBytes && i > 0) {
        cutoff = inOrder[i - 1].seq;
        break;
      }
    }
    const upTo = <T extends { seq: number }>(rows: T[]) => rows.slice(0, maxRows).filter((row) => row.seq <= cutoff);
    const sent = [upTo(sessionRows), upTo(solveRows), upTo(markRows)] as const;
    const cursor = Math.max(since, ...sent.flat().map((row) => row.seq));
    const hasMore = cutoff !== Infinity;

    return {
      cursor,
      hasMore,
      remaining: hasMore ? await countSince(tx, userId, cursor) : 0,
      changes: {
        sessions: sent[0].map(stripServerColumns),
        solves: sent[1].map((row) => fromStoredId(stripServerColumns(row))),
        sotd: sent[2].map(stripServerColumns),
      },
    };
  });
}

interface Deps {
  getSession: (headers: Headers) => Promise<{ user: { id: string } } | null>;
  db: TimerDb;
}

/** Handles POST /api/sync. */
export async function handleSync(request: Request, { getSession, db }: Deps): Promise<Response> {
  const session = await getSession(request.headers);
  if (!session) return Response.json({ error: "Sign in to sync." }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON." }, { status: 400 });
  }
  const parsed = syncRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "That isn't a valid sync request.", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });
  return Response.json(await syncForUser(db, session.user.id, parsed.data));
}
