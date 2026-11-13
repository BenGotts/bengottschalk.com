"use client";

import "@cubing/icons";
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import BackToTop from "@/components/BackToTop";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";
import type { PodiumItem, PodiumRow } from "./podiumRows";

// `step` is the medal's block on the big podium filter, `mini` on each competition's podium.
const MEDAL_STYLES = {
  gold: { label: "1st", place: "First", step: "h-28 bg-medal-gold", mini: "h-9 bg-medal-gold" },
  silver: { label: "2nd", place: "Second", step: "h-20 bg-medal-silver", mini: "h-6 bg-medal-silver" },
  bronze: { label: "3rd", place: "Third", step: "h-14 bg-medal-bronze", mini: "h-4 bg-medal-bronze" },
} as const;
const PODIUM_ORDER = ["silver", "gold", "bronze"] as const;

/** One event standing on a step: its icon, with the result that placed underneath. */
function PodiumEvent({ item }: { item: PodiumItem }) {
  const content = (
    <>
      <span className={`${item.iconClass} text-2xl leading-none`} aria-hidden="true" />
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
 */
function CompetitionPodium({ row }: { row: PodiumRow }) {
  return (
    // A solid background, so the timeline's centre line doesn't run through the podium.
    <div className="relative mx-auto flex w-fit items-end gap-1 bg-base-100 px-2">
      {PODIUM_ORDER.map((medal) => {
        const items = row.medals.filter((item) => item.medal === medal);
        const style = MEDAL_STYLES[medal];
        return (
          <div key={medal} className="flex w-[6.75rem] flex-col items-center sm:w-36">
            {items.length > 0 && (
              <ul aria-label={`${style.label} place at ${row.competitionName}`} className="flex flex-wrap items-end justify-center pb-1">
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

type Medal = PodiumItem["medal"];


/**
 * Podiums down a centre line, one node per competition with its medals below,
 * newest first, filterable by one or more placements. More competitions load
 * as you scroll.
 */
export default function PodiumTimeline({ rows, pageSize = 10 }: { rows: PodiumRow[]; pageSize?: number }) {
  // The placements picked; none picked shows them all.
  const [picked, setPicked] = useState<ReadonlySet<Medal>>(new Set());
  const toggle = (medal: Medal) => setPicked((current) => {
    const next = new Set(current);
    if (!next.delete(medal)) next.add(medal);
    return next;
  });
  const counts = useMemo(() => {
    const medals = rows.flatMap((row) => row.medals);
    const count = (medal: Medal) => medals.filter((m) => m.medal === medal).length;
    return { all: medals.length, gold: count("gold"), silver: count("silver"), bronze: count("bronze") };
  }, [rows]);
  // Competitions without a podium of a picked placement drop out.
  const filtered = useMemo(
    () =>
      picked.size === 0
        ? rows
        : rows.map((row) => ({ ...row, medals: row.medals.filter((item) => picked.has(item.medal)) })).filter((row) => row.medals.length > 0),
    [rows, picked],
  );
  const shown = picked.size === 0 ? counts.all : [...picked].reduce((sum, medal) => sum + counts[medal], 0);
  const { visible, hasMore, showMore, sentinelRef } = useIncrementalList(filtered, pageSize);

  return (
    <div className="space-y-6">
      {/* A podium of the medal counts, which doubles as the filter (pick one or more steps): 2nd, 1st, 3rd, with 1st tallest. */}
      <fieldset className="mx-auto w-full max-w-sm">
        <legend className="sr-only">Show podiums by placement</legend>
        <div className="flex items-end justify-center gap-2">
          {PODIUM_ORDER.map((medal) => {
            const style = MEDAL_STYLES[medal];
            const selected = picked.has(medal);
            return (
              <button
                key={medal}
                type="button"
                aria-pressed={selected}
                aria-label={`${style.label} place: ${counts[medal]} ${counts[medal] === 1 ? "podium" : "podiums"}`}
                onClick={() => toggle(medal)}
                className={`group flex flex-1 flex-col items-center gap-1.5 transition-opacity ${picked.size === 0 || selected ? "" : "opacity-45 hover:opacity-80"}`}
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
          <span aria-live="polite">{picked.size === 0 ? `${counts.all} podiums` : `${shown} of ${counts.all} podiums`}</span>
          {picked.size === 0 ? (
            <span>Tap steps to filter</span>
          ) : (
            <button type="button" onClick={() => setPicked(new Set())} className="link link-primary">Show all</button>
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
              <CompetitionPodium row={row} />
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
