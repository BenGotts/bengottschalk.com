import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin, FaTiktok, FaYoutube } from "react-icons/fa";

export interface NavLink {
  label: string;
  href: string;
  external?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Competitions", href: "/competitions" },
  { label: "Projects", href: "https://github.com/BenGotts?tab=repositories", external: true },
  { label: "WCA", href: "https://www.worldcubeassociation.org/persons/2016GOTT01", external: true },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const DONATE_URL = "https://ko-fi.com/bengottschalk";

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
