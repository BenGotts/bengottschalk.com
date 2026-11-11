/**
 * Each CubingUSA region's color: the five cube colors, plus four more so
 * every region has its own. Neighboring regions never share a similar hue.
 */
const REGION_COLOR: Record<string, string> = {
  Northwest: "var(--color-primary)",
  West: "var(--color-ink-orange)",
  "Rocky Mountain": "#8B5CF6",
  Heartland: "var(--color-ink-yellow)",
  South: "var(--color-ink-red)",
  "Great Lakes": "#0EA5E9",
  Southeast: "var(--color-secondary)",
  "Mid-Atlantic": "#EC4899",
  "New England": "#14B8A6",
};

export const regionColor = (name: string) => REGION_COLOR[name] ?? "var(--color-secondary)";

/** A light wash of a region's color, for backgrounds and places not yet competed in. */
export const regionWash = (name: string, percent: number) => `color-mix(in oklab, ${regionColor(name)} ${percent}%, transparent)`;

/** An id-safe slug, for the region's map patterns. */
export const regionSlug = (name: string) => name.toLowerCase().replaceAll(/[^a-z]+/g, "-");
