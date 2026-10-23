"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuMenu } from "react-icons/lu";
import { HEADER_LINKS, NAV_LINKS, type NavLink } from "@/content/links";

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
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
  const contactActive = isActive("/contact");

  return (
    <>
      <ul className="menu menu-horizontal hidden gap-0.5 text-[15px] lg:flex">
        {HEADER_LINKS.map((link) => <NavItem key={link.href} link={link} active={isActive(link.href)} />)}
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
        <summary className="btn btn-ghost btn-square" aria-label="Menu">
          <LuMenu className="size-5" aria-hidden="true" />
        </summary>
        <ul className="menu dropdown-content z-50 mt-2 w-56 rounded-box border border-base-300 bg-base-200 p-2 shadow-lg">
          {NAV_LINKS.map((link) => <NavItem key={link.href} link={link} active={isActive(link.href)} />)}
        </ul>
      </details>
    </>
  );
}
