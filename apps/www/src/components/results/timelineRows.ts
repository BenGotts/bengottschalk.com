import {
  eventIconClass,
  eventName,
  formatImprovement,
  formatResult,
  isCurrentEvent,
  type CareerMilestone,
  type CompetitionMilestones,
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
  /** A barrier broken, e.g. "Sub-10", or "First success" in Blindfolded. */
  milestone: string | null;
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
  /** Career milestones reached there, e.g. "100th competition". */
  milestones: CareerMilestone[];
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
    milestone: pr.milestone ?? null,
    href: isCurrentEvent(pr.eventId) ? `/cubing/results/${pr.eventId}` : null,
  };
}

/**
 * The timeline formatted on the server, so the browser only renders it and
 * doesn't need the WCA formatting code. `dateLabel` shows each competition's
 * dates (see `competitionDateLabels`), since results only carry the start date.
 * `milestones` adds career milestones (see `careerMilestones`): to the
 * competition's PR row, or as a row of their own where there were no PRs.
 */
export function timelineRows(
  entries: TimelineEntry[],
  dateLabel: (competitionId: string, startDate: string) => string,
  milestones: CompetitionMilestones[] = [],
): TimelineRow[] {
  const reached = new Map(milestones.map((entry) => [entry.competitionId, entry]));
  const rows = entries.map((entry) => ({
    date: entry.date,
    row: {
      competitionId: entry.competitionId,
      competitionName: entry.competitionName,
      dateLabel: dateLabel(entry.competitionId, entry.date),
      year: entry.date.slice(0, 4),
      singles: entry.prs.filter((pr) => pr.kind === "single").map(item),
      averages: entry.prs.filter((pr) => pr.kind === "average").map(item),
      milestones: reached.get(entry.competitionId)?.milestones ?? [],
    },
  }));
  const withPrs = new Set(entries.map((entry) => entry.competitionId));
  for (const entry of milestones) {
    if (withPrs.has(entry.competitionId)) continue;
    rows.push({
      date: entry.date,
      row: {
        competitionId: entry.competitionId,
        competitionName: entry.competitionName,
        dateLabel: dateLabel(entry.competitionId, entry.date),
        year: entry.date.slice(0, 4),
        singles: [],
        averages: [],
        milestones: entry.milestones,
      },
    });
  }
  // Newest first, as prTimeline orders its entries.
  return rows
    .toSorted((a, b) => b.date.localeCompare(a.date) || b.row.competitionId.localeCompare(a.row.competitionId))
    .map(({ row }) => row);
}
