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
