import type { MetadataRoute } from "next";
import { SITE_URL } from "@/consts";
import { NAV_LINKS } from "@/content/nav";
import { currentEventIds, getPerson } from "@/lib/wca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const person = await getPerson();
  const events = person.ok ? currentEventIds(Object.keys(person.data.personal_records)) : [];

  return [
    ...NAV_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href === "/" ? "" : link.href}`,
      changeFrequency: "weekly" as const,
      priority: link.href === "/" ? 1 : 0.8,
    })),
    ...["/cubing/competitions", "/cubing/places", "/cubing/results", "/cubing/timeline"].map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...events.map((event) => ({
      url: `${SITE_URL}/cubing/results/${event}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
