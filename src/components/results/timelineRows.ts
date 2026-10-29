import {
  eventIconClass,
  eventName,
  formatImprovement,
  formatIsoDate,
  formatResult,
  isCurrentEvent,
  type TimelineEntry,
  type TimelinePr,
} from "@/lib/wca";

export interface TimelineItem {
  key: string;
  eventName: string;
  iconClass: string;
  value: string;
  /** e.g. "−0.37"; null for a first result or Multi-Blind. */
  improvement: string | null;
  first: boolean;
  /** "NR", "CR", "WR" etc. when the PR was also a regional record. */
  record: string | null;
  /** The event's results page; null for retired events, which have none. */
  href: string | null;
}

export interface TimelineRow {
  competitionId: string;
  competitionName: string;
  dateLabel: string;
  year: string;
  singles: TimelineItem[];
  averages: TimelineItem[];
}

function item(pr: TimelinePr): TimelineItem {
  return {
    key: `${pr.eventId}-${pr.kind}`,
    eventName: eventName(pr.eventId),
    iconClass: eventIconClass(pr.eventId),
    value: formatResult(pr.eventId, pr.value, pr.kind),
    improvement: pr.previous === undefined ? null : formatImprovement(pr.eventId, pr.previous, pr.value, pr.kind),
    first: pr.previous === undefined,
    record: pr.record ?? null,
    href: isCurrentEvent(pr.eventId) ? `/cubing/results/${pr.eventId}` : null,
  };
}

/**
 * The timeline formatted on the server, so the browser only renders it and
 * doesn't need the WCA formatting code.
 */
export function timelineRows(entries: TimelineEntry[]): TimelineRow[] {
  return entries.map((entry) => ({
    competitionId: entry.competitionId,
    competitionName: entry.competitionName,
    dateLabel: formatIsoDate(entry.date),
    year: entry.date.slice(0, 4),
    singles: entry.prs.filter((pr) => pr.kind === "single").map(item),
    averages: entry.prs.filter((pr) => pr.kind === "average").map(item),
  }));
}
