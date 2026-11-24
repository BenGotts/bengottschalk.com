// The server's WCA import, on PGlite with the WCA's API faked.

import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { TimerDb } from "./db";
import { schema, solve, sotdMark, timerSession, user, wcaCompetition } from "./schema";
import { syncForUser } from "./sync";
import { importCompetitionResults } from "./wca";
import { handleCron } from "./wca-routes";

let db: TimerDb;

beforeAll(async () => {
  const pglite = drizzle(new PGlite(), { schema });
  await migrate(pglite, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
  db = pglite;
}, 60_000);

afterEach(() => {
  vi.unstubAllGlobals();
});

const DAY = 86_400_000;

function result(competitionId: string, startDate: string, attempts: number[]) {
  return {
    competition_id: competitionId, competition_short_name: competitionId, competition_start_date: startDate,
    event_id: "333", round_type_id: "f", pos: 1, best: Math.min(...attempts), average: 0, attempts,
    regional_single_record: null, regional_average_record: null,
  };
}

const wcif = (id: string, startDate: string, wcaIds: string[]) => ({
  id, name: `${id} full name`, events: [{ id: "333", rounds: [{ id: "333-r1" }] }],
  persons: [...wcaIds.map((wcaId) => ({ wcaId, assignments: [], name: "Not stored" })), { wcaId: null, assignments: [] }],
  schedule: { startDate, numberOfDays: 1, venues: [] },
});

/** Fakes the WCA API from a table of results per WCA ID; records every request. */
function fakeWca(results: Record<string, ReturnType<typeof result>[]>) {
  const requests: string[] = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = input instanceof Request ? input.url : input.toString();
    requests.push(url);
    const person = url.match(/\/v1\/persons\/([^/]+)\/results/);
    if (person) return Response.json(results[person[1]] ?? []);
    const competition = url.match(/\/v0\/competitions\/([^/]+)\/wcif\/public/);
    if (competition) {
      const rows = Object.entries(results).filter(([, list]) => list.some((r) => r.competition_id === competition[1]));
      if (rows.length === 0) return new Response("not found", { status: 404 });
      return Response.json(wcif(competition[1], rows[0][1][0].competition_start_date, rows.map(([wcaId]) => wcaId)));
    }
    if (url.includes("/v0/users/")) return Response.json({ ongoing_competitions: [], upcoming_competitions: [] });
    return new Response("not found", { status: 404 });
  });
  return { requests, count: (part: string) => requests.filter((u) => u.includes(part)).length };
}

let people = 0;
async function newUser(wcaId: string): Promise<string> {
  const id = `user-${++people}`;
  await db.insert(user).values({ id, name: wcaId, email: `${id}@example.com`, wcaId });
  return id;
}

const solvesOf = (userId: string) => db.select().from(solve).where(eq(solve.userId, userId));

describe("importing WCA results on the server", () => {
  it("creates official solves and main sessions that devices pull, then leaves the WCA alone until due", async () => {
    const wca = fakeWca({ "2016GOTT01": [result("NewOpen2026", "2026-11-01", [900, 1000, 1100, 1200, 1300]), result("OldOpen2020", "2020-03-01", [1500, 1600, 1700, 1800, 1900])] });
    const userId = await newUser("2016GOTT01");

    const first = await importCompetitionResults(db, userId, "2016GOTT01");
    expect(first).toMatchObject({ done: 2, total: 2, remaining: 0, saved: 10 });
    expect(await solvesOf(userId)).toHaveLength(10);
    const sessions = await db.select().from(timerSession).where(eq(timerSession.userId, userId));
    expect(sessions.map((s) => s.id)).toEqual(["main-333"]);
    const pulled = await syncForUser(db, userId, { cursor: 0, changes: { sessions: [], solves: [], sotd: [] } });
    expect(pulled.changes.solves).toHaveLength(10);
    expect(pulled.changes.solves[0].competition?.competitionName).toBe("NewOpen2026 full name");
    // Only competitors' WCA IDs and assignments are stored, not names.
    const [stored] = await db.select().from(wcaCompetition).where(eq(wcaCompetition.id, "NewOpen2026"));
    expect(JSON.stringify(stored.wcif)).not.toContain("Not stored");

    const before = wca.requests.length;
    const again = await importCompetitionResults(db, userId, "2016GOTT01");
    expect(again).toMatchObject({ remaining: 0, saved: 0 });
    expect(wca.requests.length).toBe(before);
    // Nothing changed, so nothing new for devices to pull.
    expect((await syncForUser(db, userId, { cursor: pulled.cursor, changes: { sessions: [], solves: [], sotd: [] } })).changes.solves).toHaveLength(0);
  }, 60_000);

  it("fetches a competition's schedule once for everyone at it", async () => {
    const wca = fakeWca({
      "2019AAAA01": [result("SharedOpen2025", "2025-05-01", [700, 800, 900, 1000, 1100])],
      "2019BBBB01": [result("SharedOpen2025", "2025-05-01", [1200, 1300, 1400, 1500, 1600])],
    });
    await importCompetitionResults(db, await newUser("2019AAAA01"), "2019AAAA01");
    await importCompetitionResults(db, await newUser("2019BBBB01"), "2019BBBB01");
    expect(wca.count("/wcif/public")).toBe(1);
    expect(wca.count("/v1/persons/")).toBe(2);
  }, 60_000);

  it("keeps the person's scramble and comment when an attempt changes", async () => {
    const results = { "2018CCCC01": [result("EditOpen2024", "2024-02-01", [1000, 1100, 1200, 1300, 1400])] };
    fakeWca(results);
    const userId = await newUser("2018CCCC01");
    const now = Date.now();
    await importCompetitionResults(db, userId, "2018CCCC01", { now });
    const id = "wca-EditOpen2024-333-f-1";
    await db.update(solve).set({ comment: "Lucky PLL skip", scramble: "R U R'" }).where(and(eq(solve.userId, userId), eq(solve.id, id)));

    // A result corrected by the WCA, fetched on request (allowed after 5 minutes).
    results["2018CCCC01"][0].attempts[0] = 950;
    const refreshed = await importCompetitionResults(db, userId, "2018CCCC01", { force: true, now: now + 6 * 60_000 });
    expect(refreshed.saved).toBe(1);
    const [row] = await db.select().from(solve).where(and(eq(solve.userId, userId), eq(solve.id, id)));
    expect(row).toMatchObject({ timeMs: 9500, comment: "Lucky PLL skip", scramble: "R U R'" });

    // Asking again within 5 minutes doesn't go back to the WCA.
    const wca = fakeWca(results);
    await importCompetitionResults(db, userId, "2018CCCC01", { force: true, now: now + 8 * 60_000 });
    expect(wca.count("/v1/persons/")).toBe(0);
  }, 60_000);

  it("retires live attempts the official results replace, moving Solve of the Day marks", async () => {
    fakeWca({ "2017DDDD01": [result("LiveOpen2026", "2026-10-01", [800, 900, 1000, 1100, 1200])] });
    const userId = await newUser("2017DDDD01");
    const t = Date.now() - DAY;
    // WCA Live called the round "1" instead of "f".
    await db.insert(solve).values({
      userId, id: "wca-LiveOpen2026-333-1-2", eventId: "333", sessionId: "main-333", timeMs: 9000, penalty: "none", scramble: "", comment: "",
      startedAt: t, endedAt: null, source: "competition", memoMs: null, fmc: null, multi: null, entry: "import", createdAt: t, updatedAt: t, deletedAt: null,
      competition: { competitionId: "LiveOpen2026", competitionName: "LiveOpen2026", roundTypeId: "1", roundNumber: 1, attempt: 2, status: "live", timeEstimate: "day", position: null, roundAverage: null, singleRecord: null, averageRecord: null },
    });
    await db.insert(sotdMark).values({ userId, date: "2026-10-01", solveId: "wca-LiveOpen2026-333-1-2", updatedAt: t, deletedAt: null });

    await importCompetitionResults(db, userId, "2017DDDD01");
    const [live] = await db.select().from(solve).where(and(eq(solve.userId, userId), eq(solve.id, "wca-LiveOpen2026-333-1-2")));
    expect(live.deletedAt).not.toBeNull();
    const [mark] = await db.select().from(sotdMark).where(eq(sotdMark.userId, userId));
    expect(mark).toMatchObject({ solveId: "wca-LiveOpen2026-333-f-2", deletedAt: null });
  }, 60_000);

  it("stops fetching schedules when out of time and finishes on the next call", async () => {
    const wca = fakeWca({ "2015EEEE01": [result("BudgetA2023", "2023-01-01", [1000, 1000, 1000, 1000, 1000]), result("BudgetB2022", "2022-01-01", [1000, 1000, 1000, 1000, 1000])] });
    const userId = await newUser("2015EEEE01");
    const partial = await importCompetitionResults(db, userId, "2015EEEE01", { budgetMs: -1 });
    expect(partial).toMatchObject({ done: 0, total: 2, remaining: 2 });
    const rest = await importCompetitionResults(db, userId, "2015EEEE01");
    expect(rest).toMatchObject({ done: 2, remaining: 0, saved: 10 });
    expect(wca.count("/v1/persons/")).toBe(1);
  }, 60_000);

  it("runs the daily job only with the cron secret", async () => {
    fakeWca({});
    expect((await handleCron(new Request("http://x/api/cron/wca"), { db, cronSecret: "s3cret" })).status).toBe(401);
    expect((await handleCron(new Request("http://x/api/cron/wca", { headers: { authorization: "Bearer wrong" } }), { db, cronSecret: "s3cret" })).status).toBe(401);
    expect((await handleCron(new Request("http://x/api/cron/wca", { headers: { authorization: "Bearer s3cret" } }), { db, cronSecret: undefined })).status).toBe(401);
    const ok = await handleCron(new Request("http://x/api/cron/wca", { headers: { authorization: "Bearer s3cret" } }), { db, cronSecret: "s3cret" });
    expect(ok.status).toBe(200);
  }, 60_000);
});
