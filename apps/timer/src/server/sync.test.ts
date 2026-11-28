// Runs the sync endpoint against a real Postgres (PGlite, in-process) with
// the committed migrations, and real better-auth sessions.

import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { testUtils, type TestHelpers } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { TimerSession } from "@bengottschalk/timer-core/sessions";
import { createAuth } from "@/lib/auth";
import type { TimerDb } from "./db";
import { schema } from "./schema";
import type { SotdMark } from "@bengottschalk/timer-core/sotd";
import type { SyncRequest } from "@bengottschalk/timer-core/sync";
import { handleSync, MAX_PULL, syncForUser, type TimerSyncResponse } from "./sync";

/** A request as a device sends it. */
type DeviceRequest = SyncRequest<TimerSession, Solve, SotdMark>;

let db: TimerDb;
let auth: ReturnType<typeof createAuth>;
let alice: Headers;
let bob: Headers;

beforeAll(async () => {
  const client = new PGlite();
  const pglite = drizzle(client, { schema });
  await migrate(pglite, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
  db = pglite;
  auth = createAuth({ db, secret: "test-secret-test-secret-test-secret", baseURL: "http://localhost:3004", wca: { clientId: "id", clientSecret: "secret" }, plugins: [testUtils()] });
  alice = await signIn("alice@example.com");
  bob = await signIn("bob@example.com");
}, 60_000);

/** Saves a user and returns headers carrying a real signed-in session for them. */
async function signIn(email: string): Promise<Headers> {
  // createAuth takes extra plugins untyped; testUtils adds `test` to the context.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const { test } = (await auth.$context) as unknown as { test: TestHelpers };
  const user = await test.saveUser(test.createUser({ email, name: email, wcaId: "2016GOTT01" }));
  return (await test.login({ userId: user.id })).headers;
}

const solve = (id: string, updatedAt: number, overrides: Partial<Solve> = {}): Solve => ({
  id, eventId: "333", sessionId: "main-333", timeMs: 10_000, penalty: "none", scramble: "R U", comment: "",
  startedAt: updatedAt, endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: null,
  entry: "timer", timing: "keyboard", createdAt: updatedAt, updatedAt, deletedAt: null, ...overrides,
});

/** A solve as an older version of the timer sends it: no `timing`. */
const olderSolve = (id: string, updatedAt: number, overrides: Partial<Solve> = {}): Solve => {
  const { timing: _timing, ...rest } = solve(id, updatedAt, overrides);
  return rest;
};

const main: TimerSession = {
  id: "main-333", eventId: "333", parentId: null, name: "Main", goal: null, status: "active",
  createdAt: 1, updatedAt: 1, mergedAt: null, deletedAt: null,
};

const empty = { sessions: [], solves: [], sotd: [] };

async function sync(headers: Headers | null, body: DeviceRequest | string): Promise<{ status: number; data: TimerSyncResponse }> {
  const request = new Request("http://localhost:3004/api/sync", {
    method: "POST",
    headers: headers ?? undefined,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const response = await handleSync(request, { db, getSession: (h) => auth.api.getSession({ headers: h }) });
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { status: response.status, data: (await response.json()) as TimerSyncResponse };
}

describe("POST /api/sync", () => {
  it("needs a signed-in user", async () => {
    expect((await sync(null, { cursor: 0, changes: empty })).status).toBe(401);
  });

  it("rejects requests that aren't valid", async () => {
    expect((await sync(alice, "not json")).status).toBe(400);
    expect((await sync(alice, { cursor: -1, changes: empty })).status).toBe(400);
  });

  it("stores changes and sends them back with a cursor", async () => {
    const first = await sync(alice, {
      cursor: 0,
      changes: {
        sessions: [main],
        solves: [solve("a", 100), solve("b", 100, { competition: null, fmc: null })],
        sotd: [{ eventId: "333", date: "2026-11-23", solveId: "a", updatedAt: 100, deletedAt: null }],
      },
    });
    expect(first.status).toBe(200);
    expect(first.data.changes.solves.map((s) => s.id).toSorted()).toEqual(["a", "b"]);
    expect(first.data.changes.solves[0]).toEqual(solve(first.data.changes.solves[0].id, 100));
    expect(first.data.changes.sessions).toEqual([main]);
    expect(first.data.changes.sotd).toHaveLength(1);
    expect(first.data.cursor).toBeGreaterThan(0);

    // Nothing new since that cursor.
    const again = await sync(alice, { cursor: first.data.cursor, changes: empty });
    expect(again.data.changes).toEqual(empty);
    expect(again.data.cursor).toBe(first.data.cursor);
  });

  it("keeps an FMC attempt's scratch pad, and solves from before it had one", async () => {
    const withNotes = solve("fmc-notes", 100, { eventId: "333fm", sessionId: "main-333fm", fmc: { solution: "R U R'", moves: 3, notes: "EO: R U\nblock" } });
    const without = solve("fmc-plain", 100, { eventId: "333fm", sessionId: "main-333fm", fmc: { solution: "R", moves: 1 } });
    const grace = await signIn("grace@example.com");
    const pushed = await sync(grace, { cursor: 0, changes: { ...empty, solves: [withNotes, without] } });
    expect(pushed.status).toBe(200);
    const byId = new Map(pushed.data.changes.solves.map((s) => [s.id, s]));
    expect(byId.get("fmc-notes")?.fmc).toEqual(withNotes.fmc);
    expect(byId.get("fmc-plain")?.fmc).toEqual({ solution: "R", moves: 1 });
  });

  it("keeps the newest edit of each record", async () => {
    const start = (await sync(alice, { cursor: 0, changes: empty })).data.cursor;
    // An older copy (from a device that was offline) doesn't overwrite the newer one.
    const stale = await sync(alice, { cursor: start, changes: { ...empty, solves: [solve("a", 50, { penalty: "dnf" })] } });
    expect(stale.data.changes.solves).toEqual([]);
    // A newer edit does, and comes back with a new cursor.
    const newer = await sync(alice, { cursor: start, changes: { ...empty, solves: [solve("a", 200, { penalty: "+2" })] } });
    expect(newer.data.changes.solves).toEqual([solve("a", 200, { penalty: "+2" })]);
    // A deletion is an edit like any other.
    const deleted = await sync(alice, { cursor: newer.data.cursor, changes: { ...empty, solves: [solve("a", 300, { deletedAt: 300 })] } });
    expect(deleted.data.changes.solves[0].deletedAt).toBe(300);
  });

  it("keeps every detail of a competition attempt, including ones added later", async () => {
    const competition = {
      competitionId: "BayAreaSpeedcubin2026", competitionName: "Bay Area Speedcubin' 2026", roundTypeId: "f", roundNumber: 3,
      attempt: 2, status: "official" as const, timeEstimate: "group" as const, position: 1, roundAverage: 712,
      singleRecord: "NR", averageRecord: null, futureField: { nested: true },
    };
    const attempt = solve("wca-BayAreaSpeedcubin2026-333-f-2", 400, { source: "competition", competition });
    const start = (await sync(alice, { cursor: 0, changes: empty })).data.cursor;
    const result = await sync(alice, { cursor: start, changes: { ...empty, solves: [attempt] } });
    expect(result.data.changes.solves).toEqual([attempt]);
  });

  it("keeps how a solve was timed, even when an older version of the timer edits it", async () => {
    const start = (await sync(alice, { cursor: 0, changes: empty })).data.cursor;
    const touched = await sync(alice, { cursor: start, changes: { ...empty, solves: [solve("t1", 500, { timing: "touch" })] } });
    expect(touched.data.changes.solves[0].timing).toBe("touch");
    // An older device adds a +2 without knowing about `timing`: it isn't lost.
    const edited = await sync(alice, { cursor: touched.data.cursor, changes: { ...empty, solves: [olderSolve("t1", 600, { penalty: "+2" })] } });
    expect(edited.data.changes.solves[0]).toMatchObject({ penalty: "+2", timing: "touch" });
    // A solve from an older device has none.
    const older = await sync(alice, { cursor: edited.data.cursor, changes: { ...empty, solves: [olderSolve("t2", 700)] } });
    expect(older.data.changes.solves[0].timing).toBeNull();
  });

  it("accepts timing methods a newer timer adds, but not nonsense", async () => {
    const start = (await sync(alice, { cursor: 0, changes: empty })).data.cursor;
    // Sent as raw JSON: these aren't TimingMethods this version knows.
    const withTiming = (id: string, timing: string) => JSON.stringify({ cursor: start, changes: { ...empty, solves: [{ ...solve(id, 800), timing }] } });
    expect((await sync(alice, withTiming("t3", "smart-cube-v2"))).status).toBe(200);
    expect((await sync(alice, withTiming("t4", "<script>"))).status).toBe(400);
  });

  it("keeps a Solve of the Day for each event on the same day", async () => {
    const erin = await signIn("erin@example.com");
    const day = "2026-11-24";
    const first = await sync(erin, {
      cursor: 0,
      changes: {
        ...empty,
        solves: [solve("e1", 10), solve("e2", 10, { eventId: "sq1", sessionId: "main-sq1" })],
        sotd: [
          { eventId: "333", date: day, solveId: "e1", updatedAt: 10, deletedAt: null },
          { eventId: "sq1", date: day, solveId: "e2", updatedAt: 10, deletedAt: null },
        ],
      },
    });
    expect(first.status).toBe(200);
    expect(first.data.changes.sotd.map((m) => `${m.eventId} ${m.solveId}`).toSorted()).toEqual(["333 e1", "sq1 e2"]);
    // A new 3x3 Solve of the Day for that day replaces only the 3x3 one.
    const replaced = await sync(erin, {
      cursor: first.data.cursor,
      changes: { ...empty, solves: [solve("e3", 20)], sotd: [{ eventId: "333", date: day, solveId: "e3", updatedAt: 20, deletedAt: null }] },
    });
    expect(replaced.data.changes.sotd).toEqual([{ eventId: "333", date: day, solveId: "e3", updatedAt: 20, deletedAt: null }]);
    const all = await sync(erin, { cursor: 0, changes: empty });
    expect(all.data.changes.sotd.map((m) => `${m.eventId} ${m.solveId}`).toSorted()).toEqual(["333 e3", "sq1 e2"]);
    // An event that isn't a short id is refused, like a solve's.
    const bad = JSON.stringify({ cursor: 0, changes: { ...empty, sotd: [{ eventId: "", date: day, solveId: "e1", updatedAt: 30, deletedAt: null }] } });
    expect((await sync(erin, bad)).status).toBe(400);
  });

  it("gives marks from an older version of the timer their solve's event", async () => {
    const frank = await signIn("frank@example.com");
    const day = "2026-11-24";
    const start = (await sync(frank, { cursor: 0, changes: { ...empty, solves: [solve("f1", 10, { eventId: "sq1", sessionId: "main-sq1" })] } })).data.cursor;
    // As an older device sends it: no event. "f2" arrives in the same request; "nowhere" isn't a solve the server has.
    const older = JSON.stringify({
      cursor: start,
      changes: {
        ...empty,
        solves: [solve("f2", 20)],
        sotd: [
          { date: day, solveId: "f1", updatedAt: 20, deletedAt: null },
          { date: day, solveId: "f2", updatedAt: 20, deletedAt: null },
          { date: "2026-11-23", solveId: "nowhere", updatedAt: 20, deletedAt: null },
        ],
      },
    });
    const result = await sync(frank, older);
    expect(result.status).toBe(200);
    expect(result.data.changes.sotd.map((m) => `${m.eventId} ${m.date} ${m.solveId}`).toSorted()).toEqual([`333 ${day} f2`, `sq1 ${day} f1`]);
    // Unmarking from an older device clears the right event's mark.
    const unmarked = await sync(frank, JSON.stringify({ cursor: result.data.cursor, changes: { ...empty, sotd: [{ date: day, solveId: "f1", updatedAt: 30, deletedAt: 30 }] } }));
    expect(unmarked.data.changes.sotd).toEqual([{ eventId: "sq1", date: day, solveId: "f1", updatedAt: 30, deletedAt: 30 }]);
  });

  it("gives back every kind of solve id exactly as sent, and with all its details", async () => {
    const hana = await signIn("hana@example.com");
    const solves = [
      solve("0197c3b4-d378-7e1d-ba6c-8a43fc62d744", 10, { penalty: "dnf", entry: "stackmat" }),
      solve("0197C3B4-D378-7E1D-BA6C-8A43FC62D745", 10, { penalty: "+2", entry: "typed" }),
      solve("wca-NAC2022-pyram-1-5", 10, { eventId: "pyram", sessionId: "main-pyram", source: "competition", entry: "import" }),
    ];
    const pushed = await sync(hana, { cursor: 0, changes: { ...empty, solves, sotd: [{ eventId: "pyram", date: "2026-11-24", solveId: "wca-NAC2022-pyram-1-5", updatedAt: 10, deletedAt: null }] } });
    expect(pushed.status).toBe(200);
    expect(pushed.data.changes.solves.toSorted((a, b) => a.id.localeCompare(b.id))).toEqual(solves.toSorted((a, b) => a.id.localeCompare(b.id)));
    expect(pushed.data.changes.sotd).toHaveLength(1);
    // An edit to each lands on the same row.
    const edited = await sync(hana, { cursor: pushed.data.cursor, changes: { ...empty, solves: solves.map((s) => ({ ...s, comment: "again", updatedAt: 20 })) } });
    expect(edited.data.changes.solves.map((s) => s.comment)).toEqual(["again", "again", "again"]);
    const rows = await db.select({ id: schema.solve.id }).from(schema.solve).where(eq(schema.solve.comment, "again"));
    expect(rows).toHaveLength(3);
  });

  it("keeps each person's records apart", async () => {
    const bobs = await sync(bob, { cursor: 0, changes: { ...empty, solves: [solve("a", 1, { comment: "bob's" })] } });
    expect(bobs.data.changes.solves.map((s) => s.comment)).toEqual(["bob's"]);
    const alices = await sync(alice, { cursor: 0, changes: empty });
    expect(alices.data.changes.solves.find((s) => s.id === "a")?.comment).toBe("");
  });

  it("sends large backlogs in pages", async () => {
    const carol = await signIn("carol@example.com");
    const ids = Array.from({ length: MAX_PULL + 300 }, (_, i) => `s${String(i).padStart(5, "0")}`);
    for (let i = 0; i < ids.length; i += 500) {
      await sync(carol, { cursor: 0, changes: { ...empty, solves: ids.slice(i, i + 500).map((id) => solve(id, 10)) } });
    }
    const seen = new Set<string>();
    let cursor = 0;
    let pages = 0;
    for (;;) {
      const page = await sync(carol, { cursor, changes: empty });
      page.data.changes.solves.forEach((s) => seen.add(s.id));
      cursor = page.data.cursor;
      pages++;
      if (!page.data.hasMore) break;
    }
    expect(pages).toBe(2);
    expect(seen.size).toBe(ids.length);
  }, 120_000);

  it("keeps each page under the size limit and says how much is left", async () => {
    const dave = await signIn("dave@example.com");
    const [daveUser] = await db.select().from(schema.user).where(eq(schema.user.email, "dave@example.com"));
    const ids = Array.from({ length: 40 }, (_, i) => `d${String(i).padStart(2, "0")}`);
    await sync(dave, { cursor: 0, changes: { ...empty, solves: ids.map((id) => solve(id, 10, { scramble: "R U ".repeat(500) })) } });
    // Each solve is about 1.5 KB of JSON, so a 10 KB page holds a handful.
    const first = await syncForUser(db, daveUser.id, { cursor: 0, changes: empty }, { maxBytes: 10_000 });
    const sent = first.changes.solves.length + first.changes.sessions.length;
    expect(first.hasMore).toBe(true);
    expect(sent).toBeGreaterThan(0);
    expect(sent).toBeLessThan(10);
    expect(first.remaining).toBe(40 - first.changes.solves.length);

    const seen = new Set(first.changes.solves.map((s) => s.id));
    let cursor = first.cursor;
    for (let page = 0; page < 40; page++) {
      const next = await syncForUser(db, daveUser.id, { cursor, changes: empty }, { maxBytes: 10_000 });
      next.changes.solves.forEach((s) => seen.add(s.id));
      cursor = next.cursor;
      if (!next.hasMore) {
        expect(next.remaining).toBe(0);
        break;
      }
    }
    expect(seen.size).toBe(ids.length);
  }, 60_000);
});
