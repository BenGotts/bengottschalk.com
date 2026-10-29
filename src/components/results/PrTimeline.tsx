import "@cubing/icons";
import Link from "next/link";
import ExternalLink from "@/components/ExternalLink";
import {
  eventIconClass,
  eventName,
  formatImprovement,
  formatIsoDate,
  formatResult,
  groupByYear,
  isCurrentEvent,
  type TimelineEntry,
} from "@/lib/wca";

/** One competition on the timeline: where and when, and each PR set there. */
function TimelineCompetition({ entry, nested }: { entry: TimelineEntry; nested: boolean }) {
  return (
    <li className="relative pl-7">
      {/* A dot on the line drawn by the list's left border. */}
      <span className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 bg-primary ${nested ? "border-base-200" : "border-base-100"}`} aria-hidden="true" />
      <p className="text-sm text-muted">{formatIsoDate(entry.date)}</p>
      <h3 className="font-semibold">
        <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${entry.competitionId}`} className="link link-hover">
          {entry.competitionName}
        </ExternalLink>
      </h3>
      <ul className={`mt-2 divide-y divide-base-300 rounded-box border border-base-300 ${nested ? "bg-base-100" : "bg-base-200"}`}>
        {entry.prs.map((pr) => {
          const improvement = pr.previous === undefined ? null : formatImprovement(pr.eventId, pr.previous, pr.value, pr.kind);
          const name = (
            <span className="flex min-w-0 items-start gap-2">
              <span className={`${eventIconClass(pr.eventId)} mt-1 shrink-0`} aria-hidden="true" />
              <span>
                {eventName(pr.eventId)}
                <span className="block text-xs text-muted capitalize">{pr.kind}</span>
              </span>
            </span>
          );
          return (
            <li key={`${pr.eventId}-${pr.kind}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
              {/* Retired events have no results page to link to. */}
              {isCurrentEvent(pr.eventId) ? (
                <Link href={`/cubing/results/${pr.eventId}`} className="min-w-0 hover:text-primary">{name}</Link>
              ) : (
                name
              )}
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="font-mono font-medium">{formatResult(pr.eventId, pr.value, pr.kind)}</span>
                <span className="w-14 text-right font-mono text-xs text-success">
                  {pr.previous === undefined ? <span className="font-sans text-muted">first</span> : improvement}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

/**
 * Competitions with PRs along a vertical line, newest first. `nested` is for
 * inside a panel, where the PR boxes need the page colour to stand out.
 */
export function TimelineList({ entries, nested = false }: { entries: TimelineEntry[]; nested?: boolean }) {
  return (
    <ol className="ml-1.5 space-y-6 border-l-2 border-base-300">
      {entries.map((entry) => (
        <TimelineCompetition key={entry.competitionId} entry={entry} nested={nested} />
      ))}
    </ol>
  );
}

/** The full timeline, one collapsible section per year; the newest year starts open. */
export default function PrTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-3">
      {groupByYear(entries.map((entry) => ({ ...entry, start_date: entry.date }))).map(({ year, entries: yearEntries }, index) => {
        const count = yearEntries.reduce((sum, entry) => sum + entry.prs.length, 0);
        return (
          <details key={year} open={index === 0} className="collapse collapse-arrow border border-base-300 bg-base-200">
            <summary className="collapse-title font-display text-lg font-bold">
              {year}{" "}
              <span className="font-sans text-sm font-normal text-muted">
                · {count} {count === 1 ? "PR" : "PRs"} at {yearEntries.length} {yearEntries.length === 1 ? "competition" : "competitions"}
              </span>
            </summary>
            <div className="collapse-content pt-2">
              <TimelineList entries={yearEntries} nested />
            </div>
          </details>
        );
      })}
    </div>
  );
}
