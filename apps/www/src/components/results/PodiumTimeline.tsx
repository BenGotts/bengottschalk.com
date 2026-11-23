"use client";

import { Fragment, useMemo, useState } from "react";
import BackToTop from "@/components/BackToTop";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";
import MiniPodium, { MEDAL_STYLES, PODIUM_ORDER } from "./MiniPodium";
import type { PodiumItem, PodiumRow } from "./podiumRows";

type Medal = PodiumItem["medal"];

const DOT: Record<Medal, string> = { gold: "bg-medal-gold", silver: "bg-medal-silver", bronze: "bg-medal-bronze" };

/**
 * The career medal totals once this competition is counted, with what it
 * added highlighted, so the timeline reads as a running tally.
 */
function RunningTotal({ row }: { row: PodiumRow }) {
  const { totals, added } = row;
  const label = `Career total after ${row.competitionName}: ${totals.gold} gold, ${totals.silver} silver, ${totals.bronze} bronze, ${totals.total} ${totals.total === 1 ? "podium" : "podiums"}`;
  return (
    <p className="relative mx-auto mt-2 flex w-fit items-center gap-3 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs tabular-nums">
      <span className="sr-only">{label}</span>
      {(["gold", "silver", "bronze"] as const).map((medal) => (
        <span key={medal} aria-hidden="true" className={`flex items-center gap-1 ${added[medal] > 0 ? "font-semibold text-base-content" : "text-muted"}`}>
          <span className={`size-2 rounded-full ${DOT[medal]}`} />
          {totals[medal]}
          {added[medal] > 0 && <span className={`${MEDAL_STYLES[medal].icon} font-bold`}>+{added[medal]}</span>}
        </span>
      ))}
      <span aria-hidden="true" className="border-l border-base-300 pl-3 font-semibold">{totals.total}</span>
    </p>
  );
}


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
              {row.milestone && (
                <p className="relative mx-auto mb-2 w-fit rounded-full bg-medal-gold px-3 py-0.5 text-xs font-bold text-black/80 shadow">
                  ★ {row.milestone} podiums
                </p>
              )}
              <div className="relative mx-auto mb-3 w-fit max-w-[85%] rounded-box border border-base-300 bg-base-200 px-4 py-2 text-center">
                <p className="text-xs text-muted">{row.dateLabel}</p>
                <h3 className="font-semibold leading-snug">
                  <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${row.competitionId}`} className="link link-hover">
                    {row.competitionName}
                  </ExternalLink>
                </h3>
              </div>
              {/* A solid background, so the centre line doesn't run through the podium. */}
              <MiniPodium medals={row.medals} competitionName={row.competitionName} className="relative mx-auto bg-base-100 px-2" />
              <RunningTotal row={row} />
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
