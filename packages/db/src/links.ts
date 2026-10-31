import { and, asc, count, desc, eq, gte, isNull, lt, max, sql, type SQL } from "drizzle-orm";
import { getDb, type Db } from "./client";
import { linkClicks, links, type Device, type Link, type LinkIcon } from "./schema";

/** Whether a link shows on the page at `now`: visible, not archived, and inside its schedule. */
export function isLinkLive(link: Pick<Link, "visible" | "archivedAt" | "startsAt" | "endsAt">, now: Date): boolean {
  if (!link.visible || link.archivedAt) return false;
  if (link.startsAt && link.startsAt > now) return false;
  if (link.endsAt && link.endsAt <= now) return false;
  return true;
}

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 8 random characters: short enough for tidy URLs, with ~2.8 trillion possibilities. */
export function newLinkId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ID_ALPHABET[b % ID_ALPHABET.length]).join("");
}

/** Visible, unarchived links in page order. Schedules are checked by the caller with {@link isLinkLive}. */
export async function getPublishedLinks(db: Db = getDb()): Promise<Link[]> {
  return db
    .select()
    .from(links)
    .where(and(eq(links.visible, true), isNull(links.archivedAt)))
    .orderBy(asc(links.position));
}

export async function getLink(id: string, db: Db = getDb()): Promise<Link | undefined> {
  return db.query.links.findFirst({ where: eq(links.id, id) });
}

export interface LinkWithClicks extends Link {
  clicks: { total: number; last30Days: number };
}

/** Every link, in page order (archived ones last), with click counts. */
export async function listLinks({ includeArchived = false } = {}, db: Db = getDb()): Promise<LinkWithClicks[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      link: links,
      total: count(linkClicks.id),
      last30Days: sql<number>`coalesce(sum(case when ${linkClicks.clickedAt} >= ${since.getTime()} then 1 else 0 end), 0)`,
    })
    .from(links)
    .leftJoin(linkClicks, eq(linkClicks.linkId, links.id))
    .where(includeArchived ? undefined : isNull(links.archivedAt))
    .groupBy(links.id)
    .orderBy(sql`${links.archivedAt} is not null`, asc(links.position));
  return rows.map(({ link, total, last30Days }) => ({ ...link, clicks: { total, last30Days: Number(last30Days) } }));
}

export interface LinkInput {
  label: string;
  url: string;
  description?: string | null;
  icon?: LinkIcon;
  visible?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

/** Adds a link at `position` (0 is the top), or at the bottom. */
export async function createLink(input: LinkInput & { position?: number }, db: Db = getDb()): Promise<Link> {
  const { position, ...values } = input;
  return db.transaction(async (tx) => {
    const order = await activeOrder(tx);
    const index = position === undefined ? order.length : clamp(position, 0, order.length);
    const id = newLinkId();
    await tx.insert(links).values({ ...values, id, position: index });
    await writeOrder(tx, [...order.slice(0, index), id, ...order.slice(index)]);
    return (await tx.query.links.findFirst({ where: eq(links.id, id) }))!;
  });
}

/** Changes a link. `archived: false` restores an archived link to the bottom of the page. */
export async function updateLink(
  id: string,
  patch: Partial<LinkInput> & { archived?: boolean },
  db: Db = getDb(),
): Promise<Link | undefined> {
  const { archived, ...values } = patch;
  return db.transaction(async (tx) => {
    const existing = await tx.query.links.findFirst({ where: eq(links.id, id) });
    if (!existing) return undefined;

    const set: Partial<typeof links.$inferInsert> = { ...values, updatedAt: new Date() };
    if (archived === true && !existing.archivedAt) set.archivedAt = new Date();
    if (archived === false && existing.archivedAt) {
      set.archivedAt = null;
      const [{ last }] = await tx.select({ last: max(links.position) }).from(links).where(isNull(links.archivedAt));
      set.position = (last ?? -1) + 1;
    }
    await tx.update(links).set(set).where(eq(links.id, id));
    if (archived === true) await writeOrder(tx, await activeOrder(tx));
    return tx.query.links.findFirst({ where: eq(links.id, id) });
  });
}

/** Puts the given links first, in that order; the rest keep their order after them. Returns the new order. */
export async function reorderLinks(ids: string[], db: Db = getDb()): Promise<string[]> {
  return db.transaction(async (tx) => {
    const order = await activeOrder(tx);
    const unknown = ids.filter((id) => !order.includes(id));
    if (unknown.length) throw new Error(`Unknown or archived link ids: ${unknown.join(", ")}`);
    const first = [...new Set(ids)];
    const next = [...first, ...order.filter((id) => !first.includes(id))];
    await writeOrder(tx, next);
    return next;
  });
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function activeOrder(tx: Tx): Promise<string[]> {
  const rows = await tx.select({ id: links.id }).from(links).where(isNull(links.archivedAt)).orderBy(asc(links.position), asc(links.createdAt));
  return rows.map((row) => row.id);
}

async function writeOrder(tx: Tx, ids: string[]) {
  for (const [position, id] of ids.entries()) {
    await tx.update(links).set({ position }).where(eq(links.id, id));
  }
}

const clamp = (n: number, min: number, maxValue: number) => Math.min(Math.max(n, min), maxValue);

export interface ClickInput {
  linkId: string;
  source?: string | null;
  country?: string | null;
  device?: Device | null;
  clickedAt?: Date;
}

export async function recordClick({ clickedAt = new Date(), ...click }: ClickInput, db: Db = getDb()): Promise<void> {
  await db.insert(linkClicks).values({ ...click, clickedAt });
}

export interface ClickStats {
  from: string;
  to: string;
  total: number;
  byLink: { id: string; label: string; clicks: number }[];
  /** UTC days with at least one click. */
  byDay: { date: string; clicks: number }[];
  bySource: { source: string; clicks: number }[];
  byCountry: { country: string; clicks: number }[];
  byDevice: { device: string; clicks: number }[];
}

/** Click counts between `from` (inclusive) and `to` (exclusive), for every link or one. */
export async function getClickStats(
  { from, to, linkId }: { from: Date; to: Date; linkId?: string },
  db: Db = getDb(),
): Promise<ClickStats> {
  const where = and(
    gte(linkClicks.clickedAt, from),
    lt(linkClicks.clickedAt, to),
    linkId ? eq(linkClicks.linkId, linkId) : undefined,
  );
  const clicks = count(linkClicks.id);

  const grouped = (column: SQL<string>) =>
    db.select({ key: column, clicks }).from(linkClicks).where(where).groupBy(column).orderBy(desc(clicks));

  const day = sql<string>`date(${linkClicks.clickedAt} / 1000, 'unixepoch')`;
  const [byLink, byDay, bySource, byCountry, byDevice] = await Promise.all([
    db
      .select({ id: links.id, label: links.label, clicks })
      .from(linkClicks)
      .innerJoin(links, eq(links.id, linkClicks.linkId))
      .where(where)
      .groupBy(links.id)
      .orderBy(desc(clicks)),
    db.select({ date: day, clicks }).from(linkClicks).where(where).groupBy(day).orderBy(asc(day)),
    grouped(sql<string>`coalesce(${linkClicks.source}, 'direct')`),
    grouped(sql<string>`coalesce(${linkClicks.country}, 'unknown')`),
    grouped(sql<string>`coalesce(${linkClicks.device}, 'unknown')`),
  ]);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    total: byLink.reduce((sum, row) => sum + row.clicks, 0),
    byLink,
    byDay,
    bySource: bySource.map(({ key, clicks }) => ({ source: key, clicks })),
    byCountry: byCountry.map(({ key, clicks }) => ({ country: key, clicks })),
    byDevice: byDevice.map(({ key, clicks }) => ({ device: key, clicks })),
  };
}
