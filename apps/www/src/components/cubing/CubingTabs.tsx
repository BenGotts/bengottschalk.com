"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { CUBING_SECTIONS as TABS } from "@/content/nav";
import { TONE_BORDER } from "@/lib/tones";

// Each tab underlines in its own cube color.

/** The Cubing section's tabs. Event pages count as Results. */
export default function CubingTabs({ competitionsIndicator }: {
  /** Shown on the Competitions tab while a competition is happening. */
  competitionsIndicator: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/cubing" ? pathname === href : pathname.startsWith(href));
  // On phones the tabs scroll sideways; keep the current one in view.
  const listRef = useRef<HTMLUListElement>(null);
  const activeHref = TABS.find((tab) => isActive(tab.href))?.href;
  useEffect(() => {
    if (activeHref) listRef.current?.querySelector(`a[href="${activeHref}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeHref]);

  return (
    <nav aria-label="Cubing" className="border-b border-base-300">
      <ul ref={listRef} className="-mb-px flex overflow-x-auto sm:gap-1">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border-b-2 px-1.5 py-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-4 sm:text-base ${
                  active ? `${TONE_BORDER[tab.tone]} text-base-content` : "border-transparent text-muted hover:border-base-300 hover:text-base-content"
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
