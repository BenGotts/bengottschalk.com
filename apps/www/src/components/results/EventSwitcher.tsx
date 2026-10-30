"use client";

import "@cubing/icons";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { eventIconClass, eventName } from "@/lib/wca/events";

/**
 * A row of every event with a result, the current one highlighted. On narrow
 * screens it scrolls sideways and starts with the current event in view; key
 * it by the event so it re-centres after moving to another one.
 */
export default function EventSwitcher({ eventIds, current }: { eventIds: string[]; current: string }) {
  const currentRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const link = currentRef.current;
    const list = link?.closest("ul");
    if (!link || !list) return;
    // Scroll only the row (scrollIntoView could also scroll the page).
    list.scrollLeft = link.offsetLeft - (list.clientWidth - link.offsetWidth) / 2;
  }, []);

  return (
    <nav aria-label="Events">
      <ul className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {eventIds.map((eventId) => {
          const active = eventId === current;
          return (
            <li key={eventId} className="shrink-0">
              <Link
                ref={active ? currentRef : undefined}
                href={`/cubing/results/${eventId}`}
                aria-current={active ? "page" : undefined}
                title={eventName(eventId)}
                className={`btn btn-square btn-sm text-lg ${active ? "btn-primary" : "border-base-300 bg-base-200 hover:border-primary"}`}
              >
                <span className={eventIconClass(eventId)} aria-hidden="true" />
                <span className="sr-only">{eventName(eventId)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
