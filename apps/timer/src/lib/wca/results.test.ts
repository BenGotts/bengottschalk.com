// How often the timer asks the WCA for things, with the WCA faked.

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, setMeta } from "@/lib/db";
import { competitionsToday, refreshDue, refreshLiveResults } from "./results";

const WCA_ID = "2016GOTT01";
const DAY = 86_400_000;
const iso = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

let requests: string[];

beforeEach(async () => {
  await Promise.all([db.meta.clear(), db.solves.clear()]);
  requests = [];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const url = String(input);
    requests.push(url);
    if (url.includes("/v0/users/")) {
      return Response.json({ ongoing_competitions: [{ id: "TodayOpen2026", start_date: iso(0), end_date: iso(0) }], upcoming_competitions: [] });
    }
    if (url.includes("/wcif/public")) {
      return Response.json({ id: "TodayOpen2026", name: "Today Open 2026", persons: [], schedule: { startDate: iso(0), venues: [] } });
    }
    if (url.includes("live.worldcubeassociation.org")) return Response.json({ data: { person: { results: [] } } });
    return new Response("not found", { status: 404 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const wcaRequests = (part: string) => requests.filter((url) => url.includes(part)).length;

describe("WCA requests", () => {
  it("asks for the person's competitions at most twice a day", async () => {
    expect(await competitionsToday(WCA_ID)).toEqual(["TodayOpen2026"]);
    expect(await competitionsToday(WCA_ID)).toEqual(["TodayOpen2026"]);
    expect(wcaRequests("/v0/users/")).toBe(1);
  });

  it("checks official results daily only while a recent competition's are missing", async () => {
    expect(await refreshDue(WCA_ID)).toBe(true); // Never fetched on this device.

    await setMeta(`wca:refreshedAt:${WCA_ID}`, Date.now() - 2 * DAY);
    await setMeta(`wca:competitions:${WCA_ID}`, { fetchedAt: Date.now(), competitions: [{ id: "LastWeek2026", start_date: iso(-5), end_date: iso(-4) }] });
    expect(await refreshDue(WCA_ID)).toBe(true); // Results for last week's competition aren't here yet.

    await db.solves.put({ id: "wca-LastWeek2026-333-f-1", competition: { status: "official" } } as never);
    expect(await refreshDue(WCA_ID)).toBe(false); // They are now: wait a week.

    await setMeta(`wca:refreshedAt:${WCA_ID}`, Date.now() - 8 * DAY);
    expect(await refreshDue(WCA_ID)).toBe(true);
    expect(wcaRequests("worldcubeassociation.org")).toBe(0);
  });

  it("fetches a competition's schedule every half hour at most while following WCA Live", async () => {
    await setMeta(`wca:live-person:TodayOpen2026:${WCA_ID}`, "123");
    const start = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(start);
    await refreshLiveResults("TodayOpen2026", WCA_ID);
    vi.spyOn(Date, "now").mockReturnValue(start + 10 * 60_000);
    await refreshLiveResults("TodayOpen2026", WCA_ID);
    expect(wcaRequests("/wcif/public")).toBe(1);
    expect(wcaRequests("live.worldcubeassociation.org")).toBe(2);
    vi.spyOn(Date, "now").mockReturnValue(start + 31 * 60_000);
    await refreshLiveResults("TodayOpen2026", WCA_ID);
    expect(wcaRequests("/wcif/public")).toBe(2);
  });
});
