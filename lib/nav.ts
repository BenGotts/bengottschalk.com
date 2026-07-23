export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/cubing", label: "Cubing" },
  { href: "/tech", label: "Tech" },
  { href: "/music", label: "Music" },
  { href: "/content", label: "Content" },
  { href: "/contact", label: "Contact" },
] as const;

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
