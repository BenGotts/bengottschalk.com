import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

/** Icons a link can show. The links app maps each name to an icon component. */
export const LINK_ICONS = [
  "link", "globe", "medal", "trophy", "cube", "mail", "calendar", "video", "music", "shop", "code",
  "youtube", "tiktok", "instagram", "x", "twitch", "discord", "github", "linkedin",
] as const;
export type LinkIcon = (typeof LINK_ICONS)[number];

/** The buttons on links.bengottschalk.com, edited through the MCP server. */
export const links = sqliteTable("links", {
  /** Short random id, used in click-tracking URLs (/go/<id>). */
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  /** Short line under the label. */
  description: text("description"),
  icon: text("icon", { enum: LINK_ICONS }).notNull().default("link"),
  /** Order on the page, smallest first. */
  position: integer("position").notNull(),
  /** Hidden links stay in the list but aren't shown. */
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  /** Optional schedule: only shown from `startsAt` and until `endsAt`. */
  startsAt: integer("starts_at", { mode: "timestamp_ms" }),
  endsAt: integer("ends_at", { mode: "timestamp_ms" }),
  /** Removed links are archived rather than deleted, so their clicks stay. */
  archivedAt: integer("archived_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
});

export type Link = typeof links.$inferSelect;

export const DEVICES = ["mobile", "tablet", "desktop"] as const;
export type Device = (typeof DEVICES)[number];

/** One row per counted click. No IP addresses or other identifiers are stored. */
export const linkClicks = sqliteTable(
  "link_clicks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    linkId: text("link_id").notNull().references(() => links.id, { onDelete: "cascade" }),
    clickedAt: integer("clicked_at", { mode: "timestamp_ms" }).notNull(),
    /** Where the visitor came from: a `?src=` tag on the links page URL, or the referring site. */
    source: text("source"),
    /** Two-letter country code from Vercel's geolocation header. */
    country: text("country"),
    device: text("device", { enum: DEVICES }),
  },
  (table) => [
    index("link_clicks_clicked_at_idx").on(table.clickedAt),
    index("link_clicks_link_id_clicked_at_idx").on(table.linkId, table.clickedAt),
  ],
);

export type LinkClick = typeof linkClicks.$inferSelect;
