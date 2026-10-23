"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuArrowUpRight, LuMenu } from "react-icons/lu";
import { NAV_LINKS, type NavLink } from "@/content/links";

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  if (link.external) {
    return (
      <li>
        <a href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
          <LuArrowUpRight className="size-3.5 text-muted" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={active ? "menu-active" : undefined}
      >
        {link.label}
      </Link>
    </li>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const items = NAV_LINKS.map((link) => <NavItem key={link.href} link={link} active={isActive(link.href)} />);

  return (
    <>
      <ul className="menu menu-horizontal hidden gap-1 text-[15px] lg:flex">{items}</ul>
      {/* Keyed by path so the menu closes after navigating. */}
      <details key={pathname} className="dropdown dropdown-end lg:hidden">
        <summary className="btn btn-ghost btn-square" aria-label="Menu">
          <LuMenu className="size-5" aria-hidden="true" />
        </summary>
        <ul className="menu dropdown-content z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-200 p-2 shadow-lg">
          {items}
        </ul>
      </details>
    </>
  );
}
