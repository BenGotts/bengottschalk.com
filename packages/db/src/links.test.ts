import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/libsql/migrator";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb, type Db } from "./client";
import {
  createLink,
  getClickStats,
  getPublishedLinks,
  isLinkLive,
  listLinks,
  recordClick,
  reorderLinks,
  updateLink,
} from "./links";

let db: Db;

// A fresh database with the real migrations, including the four seeded links.
beforeEach(async () => {
  db = createDb(`file:${join(mkdtempSync(join(tmpdir(), "links-")), "test.db")}`);
  await migrate(db, { migrationsFolder: join(import.meta.dirname, "../migrations") });
});

const ids = async () => (await listLinks({}, db)).map((link) => link.id);

describe("isLinkLive", () => {
  const now = new Date("2026-06-01T12:00:00Z");
  const base = { visible: true, archivedAt: null, startsAt: null, endsAt: null };

  it("shows visible links with no schedule", () => {
    expect(isLinkLive(base, now)).toBe(true);
  });

  it("hides hidden and archived links", () => {
    expect(isLinkLive({ ...base, visible: false }, now)).toBe(false);
    expect(isLinkLive({ ...base, archivedAt: new Date("2026-01-01") }, now)).toBe(false);
  });

  it("respects the schedule, with the end exclusive", () => {
    expect(isLinkLive({ ...base, startsAt: new Date("2026-06-02") }, now)).toBe(false);
    expect(isLinkLive({ ...base, startsAt: new Date("2026-05-01") }, now)).toBe(true);
    expect(isLinkLive({ ...base, endsAt: now }, now)).toBe(false);
    expect(isLinkLive({ ...base, endsAt: new Date("2026-06-02") }, now)).toBe(true);
  });
});

describe("links", () => {
  it("starts with the seeded links in order", async () => {
    expect(await ids()).toEqual(["website1", "results1", "wcaprof1", "contact1"]);
  });

  it("adds links at the bottom or at a position", async () => {
    const bottom = await createLink({ label: "Bottom", url: "https://example.com/b" }, db);
    const top = await createLink({ label: "Top", url: "https://example.com/t", icon: "youtube", position: 0 }, db);
    expect(await ids()).toEqual([top.id, "website1", "results1", "wcaprof1", "contact1", bottom.id]);
    expect(top.icon).toBe("youtube");
    expect(top.id).toMatch(/^[a-z0-9]{8}$/);
  });

  it("archives and restores links, keeping positions tidy", async () => {
    await updateLink("results1", { archived: true }, db);
    expect(await ids()).toEqual(["website1", "wcaprof1", "contact1"]);
    expect((await getPublishedLinks(db)).map((l) => l.position)).toEqual([0, 1, 2]);
    expect((await listLinks({ includeArchived: true }, db)).at(-1)?.id).toBe("results1");

    await updateLink("results1", { archived: false }, db);
    expect(await ids()).toEqual(["website1", "wcaprof1", "contact1", "results1"]);
  });

  it("leaves hidden links out of the published list", async () => {
    await updateLink("wcaprof1", { visible: false, label: "WCA" }, db);
    expect((await getPublishedLinks(db)).map((l) => l.id)).toEqual(["website1", "results1", "contact1"]);
    expect((await listLinks({}, db)).find((l) => l.id === "wcaprof1")?.label).toBe("WCA");
  });

  it("returns undefined when updating a missing link", async () => {
    expect(await updateLink("nope", { label: "x" }, db)).toBeUndefined();
  });

  it("reorders: listed ids first, the rest after", async () => {
    expect(await reorderLinks(["contact1", "wcaprof1"], db)).toEqual(["contact1", "wcaprof1", "website1", "results1"]);
    expect(await ids()).toEqual(["contact1", "wcaprof1", "website1", "results1"]);
    await expect(reorderLinks(["nope"], db)).rejects.toThrow(/nope/);
  });
});

describe("clicks", () => {
  it("counts clicks per link, day, source, country and device", async () => {
    const day1 = new Date("2026-06-01T10:00:00Z");
    const day2 = new Date("2026-06-02T10:00:00Z");
    await recordClick({ linkId: "website1", clickedAt: day1, source: "instagram", country: "US", device: "mobile" }, db);
    await recordClick({ linkId: "website1", clickedAt: day2, source: "tiktok", country: "US", device: "mobile" }, db);
    await recordClick({ linkId: "contact1", clickedAt: day2, country: "CA", device: "desktop" }, db);
    await recordClick({ linkId: "contact1", clickedAt: new Date("2026-07-01T00:00:00Z") }, db);

    const stats = await getClickStats({ from: new Date("2026-06-01"), to: new Date("2026-06-03") }, db);
    expect(stats.total).toBe(3);
    expect(stats.byLink).toEqual([
      { id: "website1", label: "My website", clicks: 2 },
      { id: "contact1", label: "Get in touch", clicks: 1 },
    ]);
    expect(stats.byDay).toEqual([{ date: "2026-06-01", clicks: 1 }, { date: "2026-06-02", clicks: 2 }]);
    expect(stats.bySource).toContainEqual({ source: "direct", clicks: 1 });
    expect(stats.byCountry[0]).toEqual({ country: "US", clicks: 2 });
    expect(stats.byDevice).toContainEqual({ device: "desktop", clicks: 1 });

    const one = await getClickStats({ from: new Date("2026-06-01"), to: new Date("2026-08-01"), linkId: "contact1" }, db);
    expect(one.total).toBe(2);

    const listed = await listLinks({}, db);
    expect(listed.find((l) => l.id === "contact1")?.clicks.total).toBe(2);
  });
});
