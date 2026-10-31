import type { LinkIcon } from "@bengottschalk/db/schema";
import type { IconType } from "react-icons";
import { FaDiscord, FaGithub, FaInstagram, FaLinkedin, FaTiktok, FaTwitch, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import {
  LuBox, LuCalendar, LuCode, LuGlobe, LuLink, LuMail, LuMedal, LuMusic, LuShoppingBag, LuTrophy, LuVideo,
} from "react-icons/lu";

/** The component for each icon name a link can store (see LINK_ICONS in @bengottschalk/db). */
export const LINK_ICON_COMPONENTS: Record<LinkIcon, IconType> = {
  link: LuLink,
  globe: LuGlobe,
  medal: LuMedal,
  trophy: LuTrophy,
  cube: LuBox,
  mail: LuMail,
  calendar: LuCalendar,
  video: LuVideo,
  music: LuMusic,
  shop: LuShoppingBag,
  code: LuCode,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  instagram: FaInstagram,
  x: FaXTwitter,
  twitch: FaTwitch,
  discord: FaDiscord,
  github: FaGithub,
  linkedin: FaLinkedin,
};
