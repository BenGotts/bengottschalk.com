"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, isNavActive } from "@/lib/nav";

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex gap-4 lg:gap-6 font-semibold text-xs tracking-wider shrink-0">
      {NAV_LINKS.map(({ href, label }) => {
        const active = isNavActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-white border-b-2 border-emerald-400 pb-0.5 whitespace-nowrap"
                : "text-slate-500 hover:text-slate-200 transition-colors whitespace-nowrap"
            }
          >
            {label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
