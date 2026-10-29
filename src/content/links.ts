import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin, FaTiktok, FaYoutube } from "react-icons/fa";

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

export const WCA_PROFILE_URL = "https://www.worldcubeassociation.org/persons/2016GOTT01";

export interface SocialLink {
  label: string;
  href: string;
  icon: IconType;
}

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/benjgottschalk", icon: FaLinkedin },
  { label: "GitHub", href: "https://github.com/BenGotts", icon: FaGithub },
  { label: "YouTube", href: "https://www.youtube.com/c/BenjaminGottschalk", icon: FaYoutube },
  { label: "TikTok", href: "https://www.tiktok.com/@bengotts", icon: FaTiktok },
];
