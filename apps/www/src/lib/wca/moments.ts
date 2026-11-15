import { competitionNumbers } from "./careerMilestones";
import type { HistoryEntry } from "./competitions";
import { eventIconClass, eventName, sortEventIds } from "./events";
import { formatResult } from "./format";
import type { CubingMoment, MomentHighlight } from "./onThisDay";
import { podiumItems } from "./podiumItems";
import { prTimeline, type TimelinePr } from "./progression";
import type { PersonResult } from "./schemas";
import { podiums, type Podium } from "./stats";

const MAX_HIGHLIGHTS = 3;

/** Records first, then barriers broken, then improvements, then first results in an event. */
const notability = (pr: TimelinePr) => (pr.record ? 4 : 0) + (pr.milestone ? 2 : 0) + (pr.previous === undefined ? 0 : 1);

/**
 * Every competition I competed in or delegated, with all its podiums and its most notable PRs,
 * formatted on the server so the browser only has to match dates (see
 * `momentsOn`). Results only carry a competition's start date, so the end date
 * comes from the history when it's there.
 */
export function cubingMoments(history: HistoryEntry[], results: PersonResult[]): CubingMoment[] {
  const highlights = new Map<string, MomentHighlight[]>();
  const add = (competitionId: string, highlight: MomentHighlight) =>
    highlights.set(competitionId, [...(highlights.get(competitionId) ?? []), highlight]);

  const podiumsAt = Map.groupBy(podiums(results), (podium: Podium) => podium.result.competition_id);
  // prTimeline lists each competition's PRs in event order, singles first; the
  // most notable go first, so records and barriers aren't hidden behind "+N more".
  for (const entry of prTimeline(results, sortEventIds)) {
    for (const pr of entry.prs.toSorted((a, b) => notability(b) - notability(a))) {
      add(entry.competitionId, {
        key: `${pr.eventId}-${pr.kind}`,
        label: `${eventName(pr.eventId)} ${pr.kind} · ${formatResult(pr.eventId, pr.value, pr.kind)}`,
        iconClass: eventIconClass(pr.eventId),
        ...(pr.record && { record: pr.record }),
        ...(pr.milestone && { milestone: pr.milestone }),
        ...(pr.previous === undefined && { first: true }),
      });
    }
  }

  const moment = (base: Omit<CubingMoment, "podiums" | "highlights" | "moreHighlights">): CubingMoment => {
    const all = highlights.get(base.competitionId) ?? [];
    return {
      ...base,
      podiums: podiumItems(podiumsAt.get(base.competitionId) ?? []),
      highlights: all.slice(0, MAX_HIGHLIGHTS),
      moreHighlights: Math.max(0, all.length - MAX_HIGHLIGHTS),
    };
  };
  const numbers = competitionNumbers(history);

  const moments = history.map((entry) => {
    const number = numbers.get(entry.id);
    return moment({
      competitionId: entry.id,
      competitionName: entry.name,
      url: entry.url,
      start: entry.start_date,
      end: entry.end_date,
      city: entry.city,
      countryIso2: entry.country_iso2,
      competed: entry.competed,
      delegated: entry.delegated,
      ...(number?.competition !== undefined && { competitionNumber: number.competition }),
      ...(number?.delegated !== undefined && { delegatedNumber: number.delegated }),
    });
  });

  // A result whose competition is missing from the history still counts, on its start date.
  const known = new Set(history.map((entry) => entry.id));
  for (const result of results) {
    if (known.has(result.competition_id)) continue;
    known.add(result.competition_id);
    moments.push(
      moment({
        competitionId: result.competition_id,
        competitionName: result.competition_short_name,
        url: `https://www.worldcubeassociation.org/competitions/${result.competition_id}`,
        start: result.competition_start_date,
        end: result.competition_start_date,
        competed: true,
        delegated: false,
      }),
    );
  }
  return moments;
}
