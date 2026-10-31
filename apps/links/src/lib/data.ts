import { cacheLife, cacheTag } from "next/cache";
import { getPublishedLinks, isLinkLive } from "@bengottschalk/db/links";
import { FALLBACK_LINKS, type PageLink } from "@/links";

/** Tag for the cached link list; the MCP server clears it after an edit (see /api/revalidate). */
export const LINKS_TAG = "links";

async function getCachedLinks(): Promise<PageLink[]> {
  "use cache";
  cacheTag(LINKS_TAG);
  // Cached until an edit clears it, so visitors rarely reach the database.
  cacheLife("max");
  return (await getPublishedLinks()).map(({ id, label, url, description, icon, visible, archivedAt, startsAt, endsAt }) => ({
    id, label, url, description, icon, visible, archivedAt, startsAt, endsAt,
  }));
}

/** The links to show right now: visible ones inside their schedule. */
export function liveLinks(links: PageLink[], now = new Date()): PageLink[] {
  return links.filter((link) => isLinkLive(link, now));
}

/** Visible links in page order, or the fallback list if the database can't be reached. */
export async function getLinks(): Promise<{ links: PageLink[]; fromDatabase: boolean }> {
  try {
    return { links: await getCachedLinks(), fromDatabase: true };
  } catch (error) {
    console.error("Couldn't load links; showing the fallback list.", error);
    return { links: FALLBACK_LINKS, fromDatabase: false };
  }
}
