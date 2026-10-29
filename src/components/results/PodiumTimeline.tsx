"use client";

import "@cubing/icons";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import BackToTop from "@/components/BackToTop";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";
import type { PodiumItem, PodiumRow } from "./podiumRows";

// The chip tint is a gradient over the solid page colour, so the centre line
// doesn't show through. `step` is the medal's block on the podium.
const MEDAL_STYLES = {
  gold: { label: "1st", dot: "bg-medal-gold", chip: "border-medal-gold/70 bg-linear-to-b from-medal-gold/10 to-medal-gold/10", step: "h-28 bg-medal-gold" },
  silver: { label: "2nd", dot: "bg-medal-silver", chip: "border-medal-silver/70 bg-linear-to-b from-medal-silver/10 to-medal-silver/10", step: "h-20 bg-medal-silver" },
  bronze: { label: "3rd", dot: "bg-medal-bronze", chip: "border-medal-bronze/70 bg-linear-to-b from-medal-bronze/10 to-medal-bronze/10", step: "h-14 bg-medal-bronze" },
} as const;
const PODIUM_ORDER = ["silver", "gold", "bronze"] as const;

/** One podium: the place, the event and the result, edged in its medal's colour. */
function Medal({ item }: { item: PodiumItem }) {
  const style = MEDAL_STYLES[item.medal];
  const name = (
    <span className="flex items-center gap-1.5 text-sm">
      <span className={`${item.iconClass} shrink-0`} aria-hidden="true" />
      {item.eventName}
    </span>
  );
  return (
    <li className={`flex flex-col items-center gap-0.5 rounded-box border bg-base-100 px-3 py-1.5 ${style.chip}`}>
      <span className="flex items-center gap-1.5 text-xs font-semibold">
        <span className={`size-2.5 rounded-full ${style.dot}`} aria-hidden="true" />
        {style.label}
      </span>
      {/* Retired events have no results page to link to. */}
      {item.href ? <Link href={item.href} className="hover:text-primary">{name}</Link> : name}
      <span className="font-mono text-sm font-medium">
        {item.value}
        <span className="sr-only"> {item.kind}</span>
      </span>
    </li>
  );
}

type Placement = "all" | PodiumItem["medal"];
const PLACEMENTS: Placement[] = ["all", "gold", "silver", "bronze"];


/**
 * Podiums down a centre line, one node per competition with its medals below,
 * newest first, filterable by placement. More competitions load as you scroll.
 */
export default function PodiumTimeline({ rows, pageSize = 10 }: { rows: PodiumRow[]; pageSize?: number }) {
  const [placement, setPlacement] = useState<Placement>("all");
  const counts = useMemo(() => {
    const medals = rows.flatMap((row) => row.medals);
    return Object.fromEntries(PLACEMENTS.map((p) => [p, p === "all" ? medals.length : medals.filter((m) => m.medal === p).length])) as Record<Placement, number>;
  }, [rows]);
  // Competitions without a podium of the chosen placement drop out.
  const filtered = useMemo(
    () =>
      placement === "all"
        ? rows
        : rows.map((row) => ({ ...row, medals: row.medals.filter((item) => item.medal === placement) })).filter((row) => row.medals.length > 0),
    [rows, placement],
  );
  const { visible, hasMore, showMore, sentinelRef } = useIncrementalList(filtered, pageSize);

  return (
    <div className="space-y-6">
      {/* A podium of the medal counts, which doubles as the filter: 2nd, 1st, 3rd, with 1st tallest. */}
      <fieldset className="mx-auto w-full max-w-sm">
        <legend className="sr-only">Show podiums by placement</legend>
        <div className="flex items-end justify-center gap-2">
          {PODIUM_ORDER.map((medal) => {
            const style = MEDAL_STYLES[medal];
            const selected = placement === medal;
            return (
              <button
                key={medal}
                type="button"
                aria-pressed={selected}
                aria-label={`${style.label} place: ${counts[medal]} ${counts[medal] === 1 ? "podium" : "podiums"}`}
                onClick={() => setPlacement(selected ? "all" : medal)}
                className={`group flex flex-1 flex-col items-center gap-1.5 transition-opacity ${placement === "all" || selected ? "" : "opacity-45 hover:opacity-80"}`}
              >
                <span className="font-display text-3xl font-bold">{counts[medal]}</span>
                <span
                  className={`flex w-full flex-col items-center justify-start rounded-t-box pt-2 font-display text-lg font-bold text-black/85 ring-offset-2 ring-offset-base-100 transition group-hover:brightness-110 ${style.step} ${
                    selected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t-2 border-base-300 pt-2 text-sm text-muted">
          <span>{counts.all} podiums</span>
          {placement === "all" ? (
            <span>Tap a step to filter</span>
          ) : (
            <button type="button" onClick={() => setPlacement("all")} className="link link-primary">Show all</button>
          )}
        </div>
      </fieldset>

      <ol className="relative">
        {/* The centre line. */}
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-base-300" aria-hidden="true" />
        {visible.map((row, index) => (
          <Fragment key={row.competitionId}>
            {row.year !== visible[index - 1]?.year && (
              <li className="relative flex justify-center pb-6" aria-hidden="true">
                <span className="rounded-full bg-primary px-4 py-1 font-display text-lg font-bold text-primary-content">{row.year}</span>
              </li>
            )}
            <li className="relative pb-10">
              <div className="relative mx-auto mb-3 w-fit max-w-[85%] rounded-box border border-base-300 bg-base-200 px-4 py-2 text-center">
                <p className="text-xs text-muted">{row.dateLabel}</p>
                <h3 className="font-semibold leading-snug">
                  <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${row.competitionId}`} className="link link-hover">
                    {row.competitionName}
                  </ExternalLink>
                </h3>
              </div>
              <ul aria-label={`Podiums at ${row.competitionName}`} className="relative flex flex-wrap justify-center gap-2">
                {row.medals.map((item) => <Medal key={item.key} item={item} />)}
              </ul>
            </li>
          </Fragment>
        ))}
      </ol>

      {hasMore && (
        <div className="flex justify-center">
          <button
            ref={(element) => { sentinelRef.current = element; }}
            type="button"
            onClick={showMore}
            className="btn btn-sm border-base-300 bg-base-200 hover:border-primary"
          >
            Show more
          </button>
        </div>
      )}

      <BackToTop />
    </div>
  );
}
