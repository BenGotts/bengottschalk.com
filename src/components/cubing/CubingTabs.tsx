"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { label: "Overview", href: "/cubing" },
  { label: "Competitions", href: "/cubing/competitions" },
  { label: "Results", href: "/cubing/results" },
  { label: "Timeline", href: "/cubing/timeline" },
];

/** The Cubing section's tabs. Event pages count as Results. */
export default function CubingTabs({ competitionsIndicator }: {
  /** Shown on the Competitions tab while a competition is happening. */
  competitionsIndicator: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/cubing" ? pathname === href : pathname.startsWith(href));

  return (
    <nav aria-label="Cubing" className="border-b border-base-300">
      <ul className="-mb-px flex gap-0.5 overflow-x-auto sm:gap-1">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border-b-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-base ${
                  active ? "border-primary text-base-content" : "border-transparent text-muted hover:border-base-300 hover:text-base-content"
                }`}
              >
                {tab.label}
                {tab.href === "/cubing/competitions" && competitionsIndicator}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
