import type { Metadata } from "next";
import { SITE_NAME } from "@/consts";

interface PageMetadata {
  /** Shown as "Title · Ben Gottschalk" via the root layout's template. */
  title: string;
  description: string;
  /** Path for the canonical URL and og:url, e.g. "/results". */
  path: string;
}

/**
 * Metadata for one page. Next merges `openGraph` shallowly, so every page sets
 * the full object here rather than relying on the layout's.
 */
export function pageMetadata({ title, description, path }: PageMetadata): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: path,
    },
  };
}
