import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import "@cubing/icons";
import PodiumTimeline from "@/components/results/PodiumTimeline";
import { podiumRows } from "@/components/results/podiumRows";
import PrTable from "@/components/results/PrTable";
import StatTile from "@/components/StatTile";
import {
  competitionDateLabels,
  eventName,
  formatResult,
  getCompetitionHistory,
  getPerson,
  getRegionalRecords,
  getResults,
  podiums,
  podiumStats,
  type PodiumStats,
} from "@/lib/wca";
import ExternalLink from "@/components/ExternalLink";

export const metadata: Metadata = pageMetadata({
  title: "Results",
  description: "Ben Gottschalk's official WCA personal records in every event, with national, continental and world ranks, medals and records.",
  path: "/cubing/results",
});

export default async function ResultsPage() {
  const [person, regionalRecords, results, history] = await Promise.all([getPerson(), getRegionalRecords(), getResults(), getCompetitionHistory()]);
  // Results only carry start dates; the history has each competition's end date.
  const dateLabel = competitionDateLabels(history.ok ? history.data.history : []);

  if (!person.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Results</h1>
        <div role="alert" className="alert alert-warning">Results couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      </div>
    );
  }

  const { personal_records, person: profile } = person.data;
  const podiumList = results.ok ? podiums(results.data) : [];
  const podiumNumbers = results.ok ? podiumStats(results.data) : null;
  const recordRows = regionalRecords.ok
    ? regionalRecords.data.flatMap((result) => [
        ...(result.regional_single_record ? [{ result, kind: "single" as const, value: result.best, record: result.regional_single_record }] : []),
        ...(result.regional_average_record ? [{ result, kind: "average" as const, value: result.average, record: result.regional_average_record }] : []),
      ])
    : [];

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Results</h1>
          <p className="mt-2 text-lg text-muted">My official WCA personal records. Pick an event to see how its PRs improved.</p>
        </div>
        <ExternalLink href={profile.url} className="btn border-base-300 bg-base-200 hover:border-primary" arrow iconClassName="-ml-1 size-[0.9em]">
          WCA profile
        </ExternalLink>
      </header>

      <section aria-labelledby="prs-heading" className="space-y-4">
        <h2 id="prs-heading" className="text-2xl font-bold">Personal records</h2>
        <PrTable records={personal_records} />
      </section>

      {recordRows.length > 0 && (
        <section aria-labelledby="records-heading" className="space-y-4">
          <h2 id="records-heading" className="scroll-mt-24 text-2xl font-bold">Records I&apos;ve set</h2>
          <ul className="space-y-3">
            {recordRows.map(({ result, kind, value, record }) => (
              <li key={`${result.id}-${kind}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-box border border-base-300 bg-base-200 p-4">
                <span className="badge border-accent bg-accent/10 font-semibold">{record}</span>
                <span className="font-semibold">{eventName(result.event_id)} {kind}</span>
                <span className="font-mono">{formatResult(result.event_id, value, kind)}</span>
                <span className="text-sm text-muted">{result.competition_short_name} · {dateLabel(result.competition_id, result.competition_start_date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {podiumList.length > 0 && (
        <section aria-labelledby="podiums-heading" className="space-y-6">
          {/* The placement filter below shows the medal counts. */}
          <h2 id="podiums-heading" className="scroll-mt-24 text-2xl font-bold">Podiums</h2>
          {podiumNumbers && <PodiumStatTiles stats={podiumNumbers} dateLabel={dateLabel} />}
          <PodiumTimeline rows={podiumRows(podiumList, dateLabel)} />
        </section>
      )}
    </div>
  )
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** Podium numbers beyond the medal counts: how often, where, and when. */
function PodiumStatTiles({ stats, dateLabel }: { stats: PodiumStats; dateLabel: ReturnType<typeof competitionDateLabels> }) {
  const { finals, podiums: total, topEvent, bestCompetition, bestYear, firstPodium, currentStreak } = stats;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {finals > 0 && (
        <StatTile tone="blue" value={`${Math.round((total / finals) * 100)}%`} label={`Of my finals ended on the podium (${total} of ${finals})`} />
      )}
      <StatTile tone="red" value={currentStreak} label={currentStreak === 1 ? "Competition in a row with a podium" : "Competitions in a row with a podium"} />
      {topEvent && (
        <StatTile tone="green" value={topEvent.count} label={`Podiums in ${eventName(topEvent.eventId)}, my most in one event`} />
      )}
      {bestCompetition && (
        <StatTile
          tone="yellow"
          value={bestCompetition.count}
          label={`Podiums at ${bestCompetition.name}, my most at one competition (${dateLabel(bestCompetition.id, bestCompetition.startDate)})`}
        />
      )}
      {bestYear && <StatTile tone="orange" value={bestYear.year} label={`My best year, with ${plural(bestYear.count, "podium")}`} />}
      {firstPodium && (
        <StatTile
          tone="blue"
          value={firstPodium.result.competition_start_date.slice(0, 4)}
          label={`First podium: ${eventName(firstPodium.result.event_id)} at ${firstPodium.result.competition_short_name}`}
        />
      )}
    </div>
  );
}
