import type { IconType } from "react-icons";
import { LuGlobe, LuMail, LuMedal, LuTrophy } from "react-icons/lu";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { SITE_URL } from "@bengottschalk/content/site";

export interface BioLink {
  label: string;
  href: string;
  icon: IconType;
  /** Short line under the label. */
  description?: string;
}

/** The big buttons, top to bottom. Edit freely: this list is only used here. */
export const FEATURED_LINKS: BioLink[] = [
  { label: "My website", description: "Cubing, videos, projects and more", href: SITE_URL, icon: LuGlobe },
  { label: "Competition results", description: "PRs, podiums and records", href: `${SITE_URL}/cubing/results`, icon: LuMedal },
  { label: "WCA profile", href: WCA_PROFILE_URL, icon: LuTrophy },
  { label: "Get in touch", href: `${SITE_URL}/contact`, icon: LuMail },
];

/** Icon row under the buttons. */
export { SOCIAL_LINKS };
