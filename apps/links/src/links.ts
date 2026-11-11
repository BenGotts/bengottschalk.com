import type { IconType } from "react-icons";
import { LuGlobe, LuMail, LuMedal, LuTrophy } from "react-icons/lu";
import { SOCIAL_LINKS, WCA_PROFILE_URL } from "@bengottschalk/content/links";
import { SITE_URL } from "@bengottschalk/content/site";

/** A cube color for a link's icon tile. */
export type Tone = "blue" | "green" | "yellow" | "red" | "orange";

export interface BioLink {
  label: string;
  href: string;
  icon: IconType;
  tone: Tone;
  /** Short line under the label. */
  description?: string;
}

/** The big buttons, top to bottom. Edit freely: this list is only used here. */
export const FEATURED_LINKS: BioLink[] = [
  { label: "My website", description: "Cubing, videos, projects and more", href: SITE_URL, icon: LuGlobe, tone: "blue" },
  { label: "Competition results", description: "PRs, podiums and records", href: `${SITE_URL}/cubing/results`, icon: LuMedal, tone: "green" },
  { label: "WCA profile", description: "Every official result", href: WCA_PROFILE_URL, icon: LuTrophy, tone: "yellow" },
  { label: "Get in touch", description: "Competitions, cubing or software", href: `${SITE_URL}/contact`, icon: LuMail, tone: "red" },
];

/** Icon row under the buttons. */
export { SOCIAL_LINKS };
