import "@cubing/icons";
import Link from "next/link";
import { currentEventIds, eventIconClass, eventName, formatResult, type Person, type Rank } from "@/lib/wca";

/** One PR: the value, with "Single · WR 670" underneath. `end` lines it up on the right. */
function PrValue({ eventId, rank, kind, end = false }: { eventId: string; rank: Rank; kind: "single" | "average"; end?: boolean }) {
  return (
    <span className={`flex flex-col ${end ? "items-end text-right" : ""}`}>
      <span className="font-mono text-base font-medium sm:text-xl">{formatResult(eventId, rank.best, kind)}</span>
      <span className="text-xs whitespace-nowrap text-muted">
        {/* Phones have column headings instead. */}
        <span className="capitalize sr-only sm:not-sr-only sm:whitespace-nowrap">{kind} · </span>WR {rank.world_rank.toLocaleString("en-US")}
      </span>
    </span>
  );
}

/**
 * Every current event's single and average PRs, each linking to its event
 * page: a compact list on phones and a grid of tiles from tablet width up,
 * with the single on the left and the average on the right.
 */
export default function PrGrid({ records }: { records: Person["personal_records"] }) {
  return (
    <ul className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200 sm:grid sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:border-0 sm:bg-transparent lg:grid-cols-4">
        <li aria-hidden="true" className="flex gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted sm:hidden">
          <span className="flex-1">Event</span>
          <span className="grid w-[11.75rem] grid-cols-2 gap-3"><span>Single</span><span className="text-right">Average</span></span>
        </li>
        {currentEventIds(Object.keys(records)).map((eventId) => {
          const { single, average } = records[eventId];
          return (
            <li key={eventId}>
              <Link
                href={`/cubing/results/${eventId}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-base-300/50 sm:h-full sm:flex-col sm:items-stretch sm:gap-2 sm:rounded-box sm:border sm:border-base-300 sm:bg-base-200 sm:py-3 sm:hover:border-primary sm:hover:bg-base-200"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold sm:flex-none">
                  <span className={`${eventIconClass(eventId)} shrink-0 text-lg`} aria-hidden="true" />
                  <span className="sm:truncate">{eventName(eventId)}</span>
                </span>
                {/* Fixed columns on phones keep the singles and averages lined up down the list. */}
                <span className="grid shrink-0 grid-cols-[5.5rem_5.5rem] gap-3 sm:grid-cols-2">
                  <PrValue eventId={eventId} rank={single} kind="single" />
                  {average ? <PrValue eventId={eventId} rank={average} kind="average" end /> : <span />}
                </span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
}
