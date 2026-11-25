// WCA Live as the main schedule source, on PGlite with WCA Live and the WCA API faked.

import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { localDate } from "@bengottschalk/timer-core/zone";
import type { TimerDb } from "./db";
import { schema, solve, user, wcaCompetition, wcaLiveCompetition, wcaPerson } from "./schema";
import { importCompetitionResults } from "./wca";
import { liveCapture } from "./wca-live";
import { handleCompetitions, handleCron, handleSchedule } from "./wca-routes";

let db: TimerDb;

beforeAll(async () => {
  const pglite = drizzle(new PGlite(), { schema });
  await migrate(pglite, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
  db = pglite;
}, 60_000);

afterEach(() => {
  vi.unstubAllGlobals();
});

const PACIFIC = "America/Los_Angeles";
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const t = (iso: string) => Date.parse(iso);

/** A competition on WCA Live, shaped like its GraphQL answer (times in UTC). */
function liveCompetition(competitionId: string, date: string, wcaId: string) {
  return {
    name: `${competitionId} (WCA Live)`, startDate: date, endDate: date,
    startTime: `${date}T16:00:00Z`, endTime: `${date}T23:59:00Z`,
    venues: [{
      timezone: PACIFIC,
      rooms: [{ activities: [{ activityCode: "333-r1", startTime: `${date}T17:00:00Z`, endTime: `${date}T18:00:00Z`, childActivities: [
        { activityCode: "333-r1-g1", startTime: `${date}T17:00:00Z`, endTime: `${date}T17:30:00Z`, childActivities: [] },
        { activityCode: "333-r1-g2", startTime: `${date}T17:30:00Z`, endTime: `${date}T18:00:00Z`, childActivities: [] },
      ] }] }],
    }],
    competitors: [
      { wcaId, assignments: [{ assignmentCode: "competitor", activity: { activityCode: "333-r1-g2", startTime: `${date}T17:30:00Z`, endTime: `${date}T18:00:00Z` } }] },
      { wcaId: null, assignments: [] },
    ],
    competitionEvents: [{ event: { id: "333" }, rounds: [{ number: 1, results: [
      { enteredAt: `${date}T17:52:00Z`, person: { wcaId } },
      { enteredAt: null, person: { wcaId: "2010OTHR01" } },
    ] }] }],
  };
}

const result = (competitionId: string, startDate: string) => ({
  competition_id: competitionId, competition_short_name: competitionId, competition_start_date: startDate,
  event_id: "333", round_type_id: "f", pos: 1, best: 900, average: 1000, attempts: [900, 1000, 1100, 1000, 1000],
  regional_single_record: null, regional_average_record: null,
});

interface Fake {
  results?: Record<string, ReturnType<typeof result>[]>;
  live?: Record<string, ReturnType<typeof liveCompetition>>;
  competitions?: { id: string; start_date: string; end_date: string }[];
}

/** Fakes WCA Live and the WCA API; records every request. */
function fake({ results = {}, live = {}, competitions = [] }: Fake) {
  const requests: string[] = [];
  const liveIds = Object.keys(live);
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input.toString();
    requests.push(url);
    const link = url.match(/live\.worldcubeassociation\.org\/link\/competitions\/([^/?]+)/);
    if (link) {
      const index = liveIds.indexOf(link[1]);
      return index < 0 ? new Response("not found", { status: 404 }) : new Response(null, { status: 302, headers: { location: `/competitions/${1000 + index}` } });
    }
    if (url.endsWith("live.worldcubeassociation.org/api")) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const { variables } = JSON.parse(typeof init?.body === "string" ? init.body : "{}") as { variables: { id: string } };
      return Response.json({ data: { competition: live[liveIds[Number(variables.id) - 1000]] ?? null } });
    }
    const person = url.match(/\/v1\/persons\/([^/]+)\/results/);
    if (person) return Response.json(results[person[1]] ?? []);
    const wcif = url.match(/\/v0\/competitions\/([^/]+)\/wcif\/public/);
    if (wcif) return Response.json({ id: wcif[1], name: `${wcif[1]} (WCIF)`, persons: [], schedule: { startDate: "2026-11-01", numberOfDays: 1, venues: [] } });
    if (url.includes("/v0/users/")) return Response.json({ ongoing_competitions: competitions, upcoming_competitions: [] });
    return new Response("not found", { status: 404 });
  });
  return { count: (part: string) => requests.filter((u) => u.includes(part)).length };
}

let people = 0;
async function newUser(wcaId: string, timeZone: string | null = null): Promise<string> {
  const id = `live-user-${++people}`;
  await db.insert(user).values({ id, name: wcaId, email: `${id}@example.com`, wcaId, timeZone });
  return id;
}

const deps = (userId: string) => ({ db, getSession: async () => ({ user: { id: userId } }) });

describe("WCA Live as the schedule source", () => {
  it("captures the schedule, groups and entry times, and places official attempts from them without the WCIF", async () => {
    const wca = fake({ results: { "2016LIVE01": [result("LiveFall2026", "2026-11-21")] }, live: { LiveFall2026: liveCompetition("LiveFall2026", "2026-11-21", "2016LIVE01") } });
    const userId = await newUser("2016LIVE01", PACIFIC);
    const now = t("2026-11-24T12:00:00Z");
    const imported = await importCompetitionResults(db, userId, "2016LIVE01", { now, timeZone: PACIFIC });
    expect(imported).toMatchObject({ done: 1, remaining: 0, saved: 5 });
    expect(wca.count("/wcif/public")).toBe(0);

    const [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, "LiveFall2026"));
    expect(row).toMatchObject({ liveId: "1000", final: true });
    expect(row.enteredAt).toEqual({ "2016LIVE01": { "333-r1": t("2026-11-21T17:52:00Z") } });
    // Only competitors with a WCA ID, and only their competing groups.
    expect(row.assignments).toEqual({ "2016LIVE01": [expect.objectContaining({ code: "333-r1-g2" })] });

    const solves = (await db.select().from(solve).where(eq(solve.userId, userId))).toSorted((a, b) => a.startedAt - b.startedAt);
    expect(solves.map((s) => s.competition?.timeEstimate)).toEqual(Array(5).fill("entered"));
    expect(solves[0].competition?.competitionName).toBe("LiveFall2026 (WCA Live)");
    // Within group 2 (17:30–18:00 UTC), before the result was entered at 17:52 …
    expect(solves[0].startedAt).toBeGreaterThan(t("2026-11-21T17:30:00Z"));
    expect(solves[4].startedAt).toBeLessThan(t("2026-11-21T17:52:00Z"));
    // … which is the morning of the 21st for this Pacific competitor.
    expect(localDate(solves[0].startedAt, PACIFIC)).toBe("2026-11-21");
  }, 60_000);

  it("falls back to the WCIF when WCA Live doesn't have the competition", async () => {
    const wca = fake({ results: { "2016WCIF01": [result("NotOnLive2026", "2026-11-01")] } });
    const userId = await newUser("2016WCIF01");
    await importCompetitionResults(db, userId, "2016WCIF01", { now: t("2026-11-24T12:00:00Z") });
    expect(wca.count("/link/competitions/NotOnLive2026")).toBe(1);
    expect(wca.count("/wcif/public")).toBe(1);
    const [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, "NotOnLive2026"));
    expect(row).toMatchObject({ liveId: null, final: true });
    const [one] = await db.select().from(solve).where(eq(solve.userId, userId));
    expect(one.competition?.competitionName).toBe("NotOnLive2026 (WCIF)");
  }, 60_000);

  it("doesn't ask WCA Live about competitions older than it keeps", async () => {
    const wca = fake({ results: { "2016OLDD01": [result("LongAgo2019", "2019-05-01")] } });
    await importCompetitionResults(db, await newUser("2016OLDD01"), "2016OLDD01", { now: t("2026-11-24T12:00:00Z") });
    expect(wca.count("live.worldcubeassociation.org")).toBe(0);
    expect(wca.count("/wcif/public")).toBe(1);
  }, 60_000);

  it("captures at most every 20 minutes while the competition is on, then once more after it and never again", async () => {
    const wca = fake({ live: { OnNow2026: liveCompetition("OnNow2026", "2026-12-05", "2016NOWW01") } });
    const during = t("2026-12-05T18:00:00Z");
    await liveCapture(db, "OnNow2026", during);
    await liveCapture(db, "OnNow2026", during + 10 * MINUTE);
    expect(wca.count("live.worldcubeassociation.org/api")).toBe(1);
    await liveCapture(db, "OnNow2026", during + 25 * MINUTE);
    expect(wca.count("live.worldcubeassociation.org/api")).toBe(2);
    let [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, "OnNow2026"));
    expect(row.final).toBe(false);

    // A day after the last activity: the final capture.
    await liveCapture(db, "OnNow2026", t("2026-12-07T01:00:00Z"));
    [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, "OnNow2026"));
    expect(row.final).toBe(true);
    await liveCapture(db, "OnNow2026", t("2027-01-10T00:00:00Z"));
    expect(wca.count("live.worldcubeassociation.org/api")).toBe(3);
  }, 60_000);

  it("gives the browser WCA Live's schedule with only the caller's groups and entry times", async () => {
    fake({ live: { Browser2026: liveCompetition("Browser2026", "2026-11-21", "2016BROW01") } });
    const userId = await newUser("2016BROW01");
    const response = await handleSchedule(new Request("http://x/api/wca/schedule?competitionId=Browser2026"), deps(userId));
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const body = (await response.json()) as { live: { assignments: object; enteredAt: object }; wcif: null };
    expect(body.wcif).toBeNull();
    expect(Object.keys(body.live.assignments)).toEqual(["2016BROW01"]);
    expect(body.live.enteredAt).toEqual({ "2016BROW01": { "333-r1": t("2026-11-21T17:52:00Z") } });
  }, 60_000);

  it("captures recently finished competitions in the daily job, even before official results are posted", async () => {
    const now = Date.now();
    const lastWeek = localDate(now - 7 * DAY, "UTC");
    fake({ live: { JustDone2026: liveCompetition("JustDone2026", lastWeek, "2016CRON01") } });
    const userId = await newUser("2016CRON01", PACIFIC);
    await db.insert(wcaPerson).values({
      wcaId: "2016CRON01", results: [], resultsFetchedAt: new Date(now),
      competitions: [{ id: "JustDone2026", start_date: lastWeek, end_date: lastWeek }], competitionsFetchedAt: new Date(now),
    });
    const response = await handleCron(new Request("http://x/api/cron/wca", { headers: { authorization: "Bearer s3cret" } }), { db, cronSecret: "s3cret" });
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const body = (await response.json()) as { report: { wcaId: string; captured?: number }[] };
    expect(body.report.find((r) => r.wcaId === "2016CRON01")?.captured).toBe(1);
    const [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, "JustDone2026"));
    expect(row.final).toBe(true);
    expect(userId).toBeTruthy();
  }, 60_000);
});

describe("the person's time zone", () => {
  it("is kept from the browser's header", async () => {
    fake({});
    const userId = await newUser("2016ZONE01");
    await handleCompetitions(new Request("http://x/api/wca/competitions", { headers: { "x-time-zone": PACIFIC } }), deps(userId));
    expect((await db.select().from(user).where(eq(user.id, userId)))[0].timeZone).toBe(PACIFIC);
    // Nonsense is ignored.
    await handleCompetitions(new Request("http://x/api/wca/competitions", { headers: { "x-time-zone": "Not/AZone" } }), deps(userId));
    expect((await db.select().from(user).where(eq(user.id, userId)))[0].timeZone).toBe(PACIFIC);
  }, 60_000);

  it("decides whether a competition has ended by the person's calendar, not the server's", async () => {
    // 7:30pm on Saturday the 21st in Oregon is already Sunday the 22nd in UTC.
    const now = t("2026-11-22T03:30:00Z");
    const competitions = [{ id: "TodayOR2026", start_date: "2026-11-21", end_date: "2026-11-21" }];
    const setup = async (wcaId: string) => {
      const userId = await newUser(wcaId);
      // Results fetched two days ago, so a finished competition without results makes them due.
      await db.insert(wcaPerson).values({ wcaId, results: [], resultsFetchedAt: new Date(now - 2 * DAY), competitions, competitionsFetchedAt: new Date(now) });
      return userId;
    };
    const pacific = fake({ competitions });
    await importCompetitionResults(db, await setup("2016ZONE02"), "2016ZONE02", { now, timeZone: PACIFIC });
    expect(pacific.count("/v1/persons/")).toBe(0); // Still the 21st there: the competition hasn't ended.

    const utc = fake({ competitions });
    await importCompetitionResults(db, await setup("2016ZONE03"), "2016ZONE03", { now, timeZone: "UTC" });
    expect(utc.count("/v1/persons/")).toBe(1);
  }, 60_000);

  it("refetches a WCIF fetched during the competition once it's over, and not while it's on", async () => {
    const wca = fake({});
    const { competitionSchedule } = await import("./wca");
    await db.insert(wcaCompetition).values({
      id: "ZonedWcif2026", fetchedAt: new Date(t("2026-11-01T18:00:00Z")),
      wcif: { id: "ZonedWcif2026", name: "Zoned", persons: [], schedule: { startDate: "2026-11-01", numberOfDays: 1, venues: [{ timezone: PACIFIC, rooms: [] }] } },
    });
    await competitionSchedule(db, "ZonedWcif2026", t("2026-11-02T12:00:00Z"));
    expect(wca.count("/wcif/public")).toBe(0);
    await competitionSchedule(db, "ZonedWcif2026", t("2026-11-04T12:00:00Z"));
    expect(wca.count("/wcif/public")).toBe(1);
    await competitionSchedule(db, "ZonedWcif2026", t("2026-11-20T12:00:00Z"));
    expect(wca.count("/wcif/public")).toBe(1);
  }, 60_000);
});
