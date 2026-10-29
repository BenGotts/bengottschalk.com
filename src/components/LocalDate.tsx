"use client";

import { useSyncExternalStore } from "react";

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

const subscribe = () => () => {};
const getClient = () => true;
const getServer = () => false;

/**
 * A moment's date in the viewer's own time zone, e.g. "Mar 1, 2025". The
 * server can't know that zone, so it renders `fallback` until the page hydrates.
 */
export default function LocalDate({ iso, fallback, className }: { iso: string; fallback: string; className?: string }) {
  const hydrated = useSyncExternalStore(subscribe, getClient, getServer);
  return (
    <time dateTime={iso} className={className}>
      {hydrated ? dateFormat.format(new Date(iso)) : fallback}
    </time>
  );
}
