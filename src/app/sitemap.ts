import type { MetadataRoute } from "next";
import { SITE_URL } from "@/consts";
import { NAV_LINKS } from "@/content/links";
import { getPerson, sortEventIds } from "@/lib/wca";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const person = await getPerson();
  const events = person.ok ? sortEventIds(Object.keys(person.data.personal_records)) : [];

  return [
    ...NAV_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href === "/" ? "" : link.href}`,
      changeFrequency: "weekly" as const,
      priority: link.href === "/" ? 1 : 0.8,
    })),
    ...events.map((event) => ({
      url: `${SITE_URL}/results/${event}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
