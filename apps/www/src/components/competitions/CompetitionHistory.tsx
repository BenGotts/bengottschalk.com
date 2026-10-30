"use client";

import { useMemo } from "react";
import CompetitionLocation from "./CompetitionLocation";
import { groupByYear, type HistoryEntry } from "@/lib/wca/competitions";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";

/** A history entry with its date already formatted, so this can render in the browser. */
export type DatedHistoryEntry = HistoryEntry & { date_range: string };

const PAGE_SIZE = 30;

/**
 * Past competitions in one continuous list, newest first, under year headings
 * that stay pinned while scrolling. More load as you scroll.
 */
export default function CompetitionHistory({ history }: { history: DatedHistoryEntry[] }) {
  const { visible, hasMore, showMore, sentinelRef } = useIncrementalList(history, PAGE_SIZE);
  // Counts cover the whole year, not just the part loaded so far.
  const yearCounts = useMemo(() => new Map(groupByYear(history).map(({ year, entries }) => [year, entries.length])), [history]);

  return (
    <div className="space-y-6">
      {groupByYear(visible).map(({ year, entries }) => {
        const count = yearCounts.get(year) ?? entries.length;
        return (
          <section key={year} aria-labelledby={`history-${year}`}>
            <h3
              id={`history-${year}`}
              className="sticky top-16 z-10 -mx-4 border-b border-base-300 bg-base-100/90 px-4 py-2 font-display text-lg font-bold backdrop-blur sm:mx-0 sm:px-0"
            >
              {year} <span className="font-sans text-sm font-normal text-muted">· {count} {count === 1 ? "competition" : "competitions"}</span>
            </h3>
            <ul className="divide-y divide-base-300">
              {entries.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                  <span className="min-w-0 flex-1 basis-56">
                    <ExternalLink href={entry.url} className="link link-hover font-medium">
                      {entry.name}
                    </ExternalLink>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      {entry.date_range}
                      <CompetitionLocation city={entry.city} countryIso2={entry.country_iso2} />
                    </span>
                  </span>
                  <span className="flex gap-1.5">
                    {entry.competed && <span className="badge badge-sm border-primary bg-primary/10">Competed</span>}
                    {entry.delegated && <span className="badge badge-sm border-secondary bg-secondary/10">Delegated</span>}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

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
