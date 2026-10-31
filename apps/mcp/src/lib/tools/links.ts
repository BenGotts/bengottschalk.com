import type { McpServer } from "@modelcontextprotocol/server";
import { LINKS_URL } from "@bengottschalk/content/site";
import {
  createLink,
  getClickStats,
  isLinkLive,
  listLinks,
  reorderLinks,
  updateLink,
  type LinkWithClicks,
} from "@bengottschalk/db/links";
import { LINK_ICONS, type Link } from "@bengottschalk/db/schema";
import { z } from "zod";
import { json } from "./public";

/** The links page to refresh after an edit; overridable for local development. */
const LINKS_APP_URL = (process.env.LINKS_APP_URL ?? LINKS_URL).replace(/\/$/, "");

/**
 * Clears the links page's cache so an edit shows right away. Without it, the
 * page keeps showing the old list until its next deploy.
 */
async function refreshLinksPage(): Promise<string> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return "Not refreshed: REVALIDATE_SECRET isn't set, so the links page shows the change after its next deploy.";
  try {
    const response = await fetch(`${LINKS_APP_URL}/api/revalidate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return "The links page shows the change now.";
    return `Not refreshed: the links page answered ${response.status}, so it shows the change after its next deploy.`;
  } catch (error) {
    return `Not refreshed (${error instanceof Error ? error.message : "network error"}), so the links page shows the change after its next deploy.`;
  }
}

function status(link: Link, now = new Date()) {
  if (link.archivedAt) return "archived";
  if (!link.visible) return "hidden";
  if (isLinkLive(link, now)) return "live";
  return link.startsAt && link.startsAt > now ? "scheduled" : "ended";
}

function describeLink(link: Link | LinkWithClicks) {
  return {
    id: link.id,
    label: link.label,
    url: link.url,
    description: link.description,
    icon: link.icon,
    status: status(link),
    visible: link.visible,
    startsAt: link.startsAt?.toISOString() ?? null,
    endsAt: link.endsAt?.toISOString() ?? null,
    archivedAt: link.archivedAt?.toISOString() ?? null,
    ...("clicks" in link ? { clicks: link.clicks } : {}),
  };
}

const notFound = (id: string) => ({
  content: [{ type: "text" as const, text: `No link with id "${id}". Use list_links to see the ids.` }],
  isError: true,
});

// A date ("2026-11-05", midnight UTC) or a date and time with an offset ("2026-11-05T18:00:00-08:00").
const dateTime = z.union([z.iso.datetime({ offset: true }), z.iso.date()]).transform((value) => new Date(value));
const httpUrl = z.url({ protocol: /^https?$/ });

const linkFields = {
  label: z.string().trim().min(1).max(60).describe("Button text."),
  url: httpUrl.describe("Where the button goes (http or https)."),
  description: z.string().trim().max(100).nullable().describe("Optional short line under the label."),
  icon: z.enum(LINK_ICONS).describe("Icon shown on the button."),
  visible: z.boolean().describe("Hidden links stay in the list but aren't shown."),
  startsAt: dateTime.nullable().describe("Only show from this time (ISO 8601). Null for no start."),
  endsAt: dateTime.nullable().describe("Stop showing at this time (ISO 8601). Null for no end."),
};

const LINKS_PAGE = `${LINKS_URL} (the link in bio on Ben's social media profiles)`;

/** Tools for managing the links page, only on the signed-in /private endpoint. */
export function registerLinkTools(server: McpServer) {
  server.registerTool(
    "list_links",
    {
      title: "List links",
      description: `The buttons on ${LINKS_PAGE}, in page order, with ids, status (live, hidden, scheduled, ended or archived) and click counts.`,
      inputSchema: z.object({
        includeArchived: z.boolean().default(false).describe("Also list removed (archived) links."),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ includeArchived }) => json((await listLinks({ includeArchived })).map(describeLink)),
  );

  server.registerTool(
    "add_link",
    {
      title: "Add a link",
      description: `Adds a button to ${LINKS_PAGE}. It goes at the bottom unless a position is given.`,
      inputSchema: z.object({
        label: linkFields.label,
        url: linkFields.url,
        description: linkFields.description.optional(),
        icon: linkFields.icon.default("link"),
        position: z.number().int().min(0).optional().describe("Where to put it: 0 is the top. Defaults to the bottom."),
        visible: linkFields.visible.default(true),
        startsAt: linkFields.startsAt.optional(),
        endsAt: linkFields.endsAt.optional(),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async (input) => {
      const link = await createLink(input);
      return json({ added: describeLink(link), page: await refreshLinksPage() });
    },
  );

  server.registerTool(
    "update_link",
    {
      title: "Update a link",
      description: `Changes a button on ${LINKS_PAGE}. Only the fields given change. Set archived to false to restore a removed link.`,
      inputSchema: z.object({
        id: z.string().describe("The link's id, from list_links."),
        label: linkFields.label.optional(),
        url: linkFields.url.optional(),
        description: linkFields.description.optional(),
        icon: linkFields.icon.optional(),
        visible: linkFields.visible.optional(),
        startsAt: linkFields.startsAt.optional(),
        endsAt: linkFields.endsAt.optional(),
        archived: z.boolean().optional().describe("true removes the link (like remove_link); false restores it at the bottom."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, ...patch }) => {
      const link = await updateLink(id, patch);
      if (!link) return notFound(id);
      return json({ updated: describeLink(link), page: await refreshLinksPage() });
    },
  );

  server.registerTool(
    "reorder_links",
    {
      title: "Reorder links",
      description: `Reorders the buttons on ${LINKS_PAGE}. The ids given go first, in that order; the rest keep their order after them.`,
      inputSchema: z.object({
        ids: z.array(z.string()).min(1).describe("Link ids, top first."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ ids }) => {
      const order = await reorderLinks(ids);
      return json({ order, page: await refreshLinksPage() });
    },
  );

  server.registerTool(
    "remove_link",
    {
      title: "Remove a link",
      description: `Removes a button from ${LINKS_PAGE}. The link is archived, not deleted: its click history stays, and update_link with archived: false brings it back.`,
      inputSchema: z.object({
        id: z.string().describe("The link's id, from list_links."),
      }),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const link = await updateLink(id, { archived: true });
      if (!link) return notFound(id);
      return json({ removed: describeLink(link), page: await refreshLinksPage() });
    },
  );

  server.registerTool(
    "get_link_stats",
    {
      title: "Link click stats",
      description:
        `Clicks on ${LINKS_PAGE}: totals per link, per day (UTC), and by source, country and device. ` +
        "Source is the ?src= tag on the links page URL (e.g. links.bengottschalk.com?src=instagram) or the referring site; 'direct' when neither is known. " +
        "Bots and link previews aren't counted.",
      inputSchema: z.object({
        days: z.number().int().min(1).max(3650).default(30).describe("How many days back to look, ending now. Ignored when from is given."),
        from: dateTime.optional().describe("Start of the period (ISO 8601)."),
        to: dateTime.optional().describe("End of the period (ISO 8601). Defaults to now."),
        linkId: z.string().optional().describe("Only this link's clicks."),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ days, from, to, linkId }) => {
      const end = to ?? new Date();
      const start = from ?? new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      return json(await getClickStats({ from: start, to: end, linkId }));
    },
  );
}
