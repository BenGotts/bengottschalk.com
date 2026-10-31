import type { Link } from "@bengottschalk/db/schema";
import { WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { SITE_URL } from "@bengottschalk/content/site";

/** The links a visitor sees on the page; a subset of the database row. */
export type PageLink = Pick<Link, "id" | "label" | "url" | "description" | "icon" | "visible" | "archivedAt" | "startsAt" | "endsAt">;

/**
 * Shown if the database can't be reached, so the page is never empty.
 * The real list lives in the database and is edited through the MCP server.
 */
const ALWAYS = { visible: true, archivedAt: null, startsAt: null, endsAt: null } as const;

export const FALLBACK_LINKS: PageLink[] = [
  { ...ALWAYS, id: "fallback-website", label: "My website", description: "Cubing, videos, projects and more", url: SITE_URL, icon: "globe" },
  { ...ALWAYS, id: "fallback-results", label: "Competition results", description: "PRs, podiums and records", url: `${SITE_URL}/cubing/results`, icon: "medal" },
  { ...ALWAYS, id: "fallback-wca", label: "WCA profile", description: null, url: WCA_PROFILE_URL, icon: "trophy" },
  { ...ALWAYS, id: "fallback-contact", label: "Get in touch", description: null, url: `${SITE_URL}/contact`, icon: "mail" },
];
