import "@cubing/icons";
import Link from "next/link";
import type { PodiumItem } from "@/lib/wca/podiumItems";

// `step` is the medal's block on the big podium filter (PodiumTimeline), `mini` on a competition's podium.
// `icon` colours the events standing on a step, so each is easy to match to its place.
export const MEDAL_STYLES = {
  gold: { label: "1st", place: "First", step: "h-28 bg-medal-gold", mini: "h-9 bg-medal-gold", icon: "text-ink-gold" },
  silver: { label: "2nd", place: "Second", step: "h-20 bg-medal-silver", mini: "h-6 bg-medal-silver", icon: "text-ink-silver" },
  bronze: { label: "3rd", place: "Third", step: "h-14 bg-medal-bronze", mini: "h-4 bg-medal-bronze", icon: "text-ink-bronze" },
} as const;
export const PODIUM_ORDER = ["silver", "gold", "bronze"] as const;

/** One event standing on a step: its icon, with the result that placed underneath. */
function PodiumEvent({ item }: { item: PodiumItem }) {
  const content = (
    <>
      <span className={`${item.iconClass} text-2xl leading-none ${MEDAL_STYLES[item.medal].icon}`} aria-hidden="true" />
      <span className="font-mono text-[11px] font-medium sm:text-xs">{item.value}</span>
      <span className="sr-only">{`${MEDAL_STYLES[item.medal].place} in ${item.eventName}, ${item.kind} ${item.value}`}</span>
    </>
  );
  // Two fit side by side on a step, even on phones.
  const className = "flex w-[3.25rem] flex-col items-center gap-1 rounded-field py-1 sm:w-16 sm:px-1";
  return (
    <li title={item.eventName}>
      {/* Retired events have no results page to link to. */}
      {item.href ? <Link href={item.href} className={`${className} transition-colors hover:bg-base-300/60 hover:text-primary`}>{content}</Link> : <span className={className}>{content}</span>}
    </li>
  );
}

/**
 * A competition's podiums as a podium: 2nd, 1st and 3rd steps, with the events
 * I placed in standing on each. Steps without a podium there stay faint.
 * Used on the podium timeline and the On this day card.
 */
export default function MiniPodium({ medals, competitionName, className = "" }: { medals: PodiumItem[]; competitionName: string; className?: string }) {
  return (
    <div className={`flex w-fit items-end gap-1 ${className}`}>
      {PODIUM_ORDER.map((medal) => {
        const items = medals.filter((item) => item.medal === medal);
        const style = MEDAL_STYLES[medal];
        // Fits a phone with room to spare: two events across a step.
        return (
          <div key={medal} className="flex w-[6.5rem] flex-col items-center sm:w-36">
            {items.length > 0 && (
              <ul aria-label={`${style.label} place at ${competitionName}`} className="flex flex-wrap items-end justify-center pb-1">
                {items.map((item) => <PodiumEvent key={item.key} item={item} />)}
              </ul>
            )}
            <span
              aria-hidden="true"
              className={`flex w-full justify-center rounded-t-md font-display text-xs font-bold leading-4 text-black/80 ${style.mini} ${items.length > 0 ? "" : "opacity-25"}`}
            >
              {style.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
