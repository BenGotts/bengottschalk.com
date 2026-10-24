"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LuMenu } from "react-icons/lu";
import { HEADER_LINKS, NAV_LINKS, type NavLink } from "@/content/links";

function NavItem({ link, active, indicator }: { link: NavLink; active: boolean; indicator?: ReactNode }) {
  return (
    <li>
      <Link
        href={link.href}
        aria-current={active ? "page" : undefined}
        className={active ? "menu-active" : undefined}
      >
        {link.label}
        {indicator}
      </Link>
    </li>
  );
}

export default function SiteNav({ competitionsIndicator, menuIndicator }: {
  /** Shown after the Competitions link while a competition is happening. */
  competitionsIndicator: ReactNode;
  /** Shown on the phone menu button, since the link is hidden inside it. */
  menuIndicator: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const contactActive = isActive("/contact");
  const indicatorFor = (link: NavLink) => (link.href === "/competitions" ? competitionsIndicator : undefined);

  return (
    <>
      <ul className="menu menu-horizontal hidden gap-0.5 text-[15px] lg:flex">
        {HEADER_LINKS.map((link) => (
          <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} />
        ))}
      </ul>
      <Link
        href="/contact"
        aria-current={contactActive ? "page" : undefined}
        className={`btn btn-sm ml-2 hidden lg:inline-flex ${contactActive ? "btn-primary" : "btn-outline btn-primary"}`}
      >
        Contact
      </Link>
      {/* Keyed by path so the menu closes after navigating. */}
      <details key={pathname} className="dropdown dropdown-end lg:hidden">
        <summary className="btn btn-ghost btn-square relative" aria-label="Menu">
          <LuMenu className="size-5" aria-hidden="true" />
          {menuIndicator}
        </summary>
        <ul className="menu dropdown-content z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-200 p-2 shadow-lg">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.href} link={link} active={isActive(link.href)} indicator={indicatorFor(link)} />
          ))}
        </ul>
      </details>
    </>
  );
}
