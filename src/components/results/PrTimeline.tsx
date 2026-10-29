"use client";

import "@cubing/icons";
import Link from "next/link";
import { Fragment } from "react";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";
import type { TimelineItem, TimelineRow } from "./timelineRows";

/**
 * One PR, aligned towards the centre line: right-aligned on the singles side.
 * A PR that was also a record (NR, CR, WR) is highlighted with its badge, and
 * one that broke a barrier gets a milestone badge (e.g. "Sub-10"). An event's
 * first result gets a "First" badge.
 */
function Pr({ item, side, showEvent }: { item: TimelineItem; side: "left" | "right"; showEvent: boolean }) {
  const name = (
    <span className={`flex items-start gap-1.5 text-sm ${side === "left" ? "flex-row-reverse text-right" : ""}`}>
      <span className={`${item.iconClass} mt-0.5 shrink-0`} aria-hidden="true" />
      {item.eventName}
    </span>
  );
  return (
    <li
      className={`flex flex-col gap-0.5 rounded-box border px-2.5 py-1.5 ${side === "left" ? "items-end" : "items-start"} ${
        item.record ? "border-accent/60 bg-accent/10" : "border-transparent"
      }`}
    >
      {/* Retired events have no results page to link to. */}
      {showEvent && (item.href ? <Link href={item.href} className="hover:text-primary">{name}</Link> : name)}
      <span className={`flex items-baseline gap-2 ${side === "left" ? "flex-row-reverse" : ""}`}>
        <span className="font-mono text-lg font-medium">{item.value}</span>
        {item.improvement && <span className="font-mono text-xs text-success">{item.improvement}</span>}
      </span>
      {/* "First success" already says it for Blindfolded, so it replaces the "First" badge. */}
      {(item.record || item.milestone || item.first) && (
        <span className={`flex flex-wrap gap-1 ${side === "left" ? "justify-end" : ""}`}>
          {item.first && !item.milestone && <span className="badge badge-sm border-secondary bg-secondary/15 font-semibold">First</span>}
          {item.record && <span className="badge badge-sm border-accent bg-accent/15 font-semibold">{item.record}</span>}
          {item.milestone && <span className="badge badge-sm border-primary bg-primary/15 font-semibold whitespace-nowrap">{item.milestone}</span>}
        </span>
      )}
    </li>
  );
}

function Side({ items, side, label, showEvent }: { items: TimelineItem[]; side: "left" | "right"; label: string; showEvent: boolean }) {
  return (
    <ul aria-label={label} className={`space-y-1 ${side === "left" ? "pr-2 sm:pr-6" : "pl-2 sm:pl-6"}`}>
      {items.map((item) => <Pr key={item.key} item={item} side={side} showEvent={showEvent} />)}
    </ul>
  );
}

/**
 * PRs down a centre line, singles on the left and averages on the right, one
 * node per competition. More competitions load as you scroll. With `compact`
 * (the Overview's teaser) the column labels aren't pinned and there are no
 * year markers. `showEvent={false}` leaves out each PR's event name, for an
 * event's own page.
 */
export default function PrTimeline({ rows, pageSize = 12, compact = false, showEvent = true }: {
  rows: TimelineRow[];
  pageSize?: number;
  compact?: boolean;
  showEvent?: boolean;
}) {
  const { visible, hasMore, showMore, sentinelRef } = useIncrementalList(rows, pageSize);

  return (
    <div>
      {/* Pinned under the site header on the full timeline, so the sides stay labelled while scrolling. */}
      <div
        className={`grid grid-cols-2 border-b border-base-300 py-2 text-sm font-semibold uppercase tracking-wider text-muted ${
          compact ? "" : "sticky top-16 z-10 -mx-4 bg-base-100/90 px-4 backdrop-blur sm:mx-0 sm:px-0"
        }`}
      >
        <span className="pr-4 text-right sm:pr-8">Singles</span>
        <span className="pl-4 sm:pl-8">Averages</span>
      </div>

      <ol className="relative pt-6">
        {/* The centre line. */}
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-base-300" aria-hidden="true" />
        {visible.map((row, index) => {
          const newYear = !compact && row.year !== visible[index - 1]?.year;
          return (
            <Fragment key={row.competitionId}>
              {newYear && (
                <li className="relative flex justify-center pb-6" aria-hidden="true">
                  <span className="rounded-full bg-primary px-4 py-1 font-display text-lg font-bold text-primary-content">{row.year}</span>
                </li>
              )}
              <li className="relative pb-10">
                <div className="relative mx-auto mb-4 w-fit max-w-[85%] rounded-box border border-base-300 bg-base-200 px-4 py-2 text-center">
                  <p className="text-xs text-muted">{row.dateLabel}</p>
                  <h3 className="font-semibold leading-snug">
                    <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${row.competitionId}`} className="link link-hover">
                      {row.competitionName}
                    </ExternalLink>
                  </h3>
                </div>
                <div className="grid grid-cols-2">
                  <Side items={row.singles} side="left" label="Single PRs" showEvent={showEvent} />
                  <Side items={row.averages} side="right" label="Average PRs" showEvent={showEvent} />
                </div>
              </li>
            </Fragment>
          );
        })}
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
    </div>
  );
}
