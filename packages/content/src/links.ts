import type { IconType } from "react-icons";
import { FaGithub, FaLinkedin, FaTiktok, FaYoutube } from "react-icons/fa";

export const WCA_PROFILE_URL = "https://www.worldcubeassociation.org/persons/2016GOTT01";

export interface SocialLink {
  label: string;
  href: string;
  icon: IconType;
}

/** Shown on the website, the links page and through the MCP server. */
export const SOCIAL_LINKS: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/benjgottschalk", icon: FaLinkedin },
  { label: "GitHub", href: "https://github.com/BenGotts", icon: FaGithub },
  { label: "YouTube", href: "https://www.youtube.com/c/BenjaminGottschalk", icon: FaYoutube },
  { label: "TikTok", href: "https://www.tiktok.com/@bengotts", icon: FaTiktok },
];
