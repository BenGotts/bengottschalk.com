import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { LuArrowRight, LuMap } from "react-icons/lu";
import ExternalLink from "@/components/ExternalLink";
import SectionHeader from "@/components/SectionHeader";
import CubingStats from "@/components/cubing/CubingStats";
import CompetitionCard from "@/components/competitions/CompetitionCard";
import CompetitionLocation from "@/components/competitions/CompetitionLocation";
import LiveCompetitionSummary from "@/components/competitions/LiveCompetitionSummary";
import PrCard from "@/components/results/PrCard";
import PrTimeline from "@/components/results/PrTimeline";
import { timelineRows } from "@/components/results/timelineRows";
import {
  cubingStats,
  finishedCompetitions,
  formatDelegateStatus,
  formatIsoDate,
  getCompetitionHistory,
  getCompetitionsOverview,
  getDelegateRole,
  getPerson,
  getResults,
  highlightEvents,
  prTimeline,
  sortEventIds,
} from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "Cubing",
  description: "Ben Gottschalk's speedcubing: upcoming WCA competitions, personal records, medals, and every competition he has competed in or delegated.",
  path: "/cubing",
});

export default async function CubingPage() {
  const [person, role, competitions, historyResult, results] = await Promise.all([
    getPerson(),
    getDelegateRole(),
    getCompetitionsOverview(),
    getCompetitionHistory(),
    getResults(),
  ]);

  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const nextUp = competitions.ok ? competitions.data.upcoming.slice(0, 2) : [];
  const history = historyResult.ok
    ? finishedCompetitions(historyResult.data.history, competitions.ok ? competitions.data : null, historyResult.data.utcToday)
    : [];
  const stats = person.ok && historyResult.ok ? cubingStats(person.data, history) : null;
  const firstYear = history.findLast((entry) => entry.competed)?.start_date.slice(0, 4);
  const recent = history.slice(0, 4);
  const latestPrs = results.ok ? prTimeline(results.data, sortEventIds).slice(0, 3) : [];

  return (
    <div className="space-y-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Cubing</h1>
          <p className="mt-2 max-w-2xl text-lg text-muted">
            {firstYear ? <>I&apos;ve competed in WCA competitions since {firstYear}</> : <>I compete in WCA competitions</>}
            {role.ok && role.data
              ? <>, and I&apos;m a {formatDelegateStatus(role.data.status)} for {role.data.region} since {role.data.since.slice(0, 4)}.</>
              : "."}
          </p>
        </div>
        {person.ok && (
          <ExternalLink href={person.data.person.url} className="btn border-base-300 bg-base-200 hover:border-primary" arrow iconClassName="-ml-1 size-[0.9em]">
            WCA profile
          </ExternalLink>
        )}
      </header>

      {(ongoing.length > 0 || nextUp.length > 0) && (
        <section aria-labelledby="next-heading" className="space-y-4">
          <SectionHeader
            id="next-heading"
            title={ongoing.length > 0 ? "Happening now" : "Next up"}
            href="/cubing/competitions"
            linkLabel="All competitions"
          />
          {ongoing.length > 0 ? (
            <div className="space-y-4">
              {ongoing.map((competition) => (
                <LiveCompetitionSummary key={competition.id} competition={competition} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {nextUp.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          )}
        </section>
      )}

      {stats && (
        <section aria-label="Stats">
          <CubingStats stats={stats} />
        </section>
      )}

      {person.ok && (
        <section aria-labelledby="highlights-heading" className="space-y-4">
          <SectionHeader id="highlights-heading" title="Personal records" href="/cubing/results" linkLabel="All events" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {highlightEvents(person.data.personal_records, 4).map((eventId) => (
              <PrCard key={eventId} eventId={eventId} record={person.data.personal_records[eventId]} />
            ))}
          </div>
        </section>
      )}

      {latestPrs.length > 0 && (
        <section aria-labelledby="latest-prs-heading" className="space-y-4">
          <SectionHeader id="latest-prs-heading" title="Latest PRs" href="/cubing/timeline" linkLabel="PR timeline" />
          <PrTimeline rows={timelineRows(latestPrs)} compact />
        </section>
      )}

      {recent.length > 0 && stats && (
        <section aria-labelledby="recent-heading" className="space-y-4">
          <SectionHeader id="recent-heading" title="Recent competitions" href="/cubing/competitions#past-heading" linkLabel="Full history" />
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <ul className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200 px-5">
              {recent.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="min-w-0 flex-1">
                    <ExternalLink href={entry.url} className="link link-hover font-medium">{entry.name}</ExternalLink>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                      {formatIsoDate(entry.start_date)}
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
            <Link
              href="/cubing/competitions#map"
              className="group flex flex-col justify-between gap-6 rounded-box border border-base-300 bg-base-200 p-5 transition-colors hover:border-primary focus-visible:border-primary"
            >
              <LuMap className="size-8 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-display text-4xl font-bold">{stats.countries}</span>
                <span className="block text-sm text-muted">
                  {stats.countries === 1 ? "country" : "countries"}
                  {stats.usStates > 0 && <> · {stats.usStates} US {stats.usStates === 1 ? "state" : "states"}</>}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                Explore the map <LuArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>
      )}

      {!person.ok && !competitions.ok && (
        <div role="alert" className="alert alert-warning">
          Cubing data couldn&apos;t be loaded from the WCA right now. Please try again later.
        </div>
      )}
    </div>
  );
}
