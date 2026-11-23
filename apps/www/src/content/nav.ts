import type { IconType } from "react-icons";
import { LuCalendarDays, LuHistory, LuLayoutDashboard, LuMapPin, LuTimer, LuTrophy } from "react-icons/lu";
import type { Tone } from "@/lib/tones";

export interface NavLink {
  label: string;
  href: string;
}

/** Every page: the footer and the mobile menu list all of them. */
export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Cubing", href: "/cubing" },
  { label: "Videos", href: "/videos" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** The desktop header leaves out Home (the logo links there) and Contact (shown as a button). */
export const HEADER_LINKS: NavLink[] = NAV_LINKS.filter((link) => link.href !== "/" && link.href !== "/contact");

export interface CubingSection extends NavLink {
  /** One line on what's there, for the header's Cubing menu. */
  description: string;
  icon: IconType;
  /** The cube color of its tab underline and menu icon. */
  tone: Tone;
}

/** The Cubing section's pages: its tabs, and the header's Cubing menu. */
export const CUBING_SECTIONS: CubingSection[] = [
  { label: "Overview", href: "/cubing", description: "Stats, PRs and what's coming up", icon: LuLayoutDashboard, tone: "blue" },
  { label: "Competitions", href: "/cubing/competitions", description: "Upcoming, live and every past competition", icon: LuCalendarDays, tone: "green" },
  { label: "Places", href: "/cubing/places", description: "States and countries I've competed in", icon: LuMapPin, tone: "red" },
  { label: "Results", href: "/cubing/results", description: "Personal records and ranks in every event", icon: LuTimer, tone: "orange" },
  { label: "Podiums", href: "/cubing/podiums", description: "Trophy cabinet and every podium", icon: LuTrophy, tone: "yellow" },
  { label: "Timeline", href: "/cubing/timeline", description: "PRs and milestones over the years", icon: LuHistory, tone: "blue" },
];
