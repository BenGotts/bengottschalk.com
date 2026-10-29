"use client";

import { useNow } from "@/lib/useNow";
// Import the pure module directly: the wca index also exports server-only API code.
import { localDateString } from "@/lib/wca/competitions";
import type { LiveWindow } from "@/lib/wca/api";

/** Whether a competition is on at its venue right now (between its dates, in the venue's time zone). */
export function isLive(window: LiveWindow, now: Date): boolean {
  const today = localDateString(now, window.timezone ?? "UTC");
  return window.start_date <= today && today <= window.end_date;
}

/** The live dot, shown while any of the competitions is on. Updates every 30 seconds. */
export default function LiveDot({ windows, placement }: { windows: LiveWindow[]; placement: "inline" | "corner" }) {
  const now = useNow();
  if (now === null || !windows.some((window) => isLive(window, new Date(now)))) return null;
  return (
    <span className={placement === "corner" ? "absolute top-1.5 right-1.5 flex" : "ml-0.5 inline-flex"}>
      <span className="status status-error animate-pulse" aria-hidden="true" />
      <span className="sr-only">{placement === "corner" ? "A competition is happening now" : "(happening now)"}</span>
    </span>
  );
}
