import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import BackToTop from "@/components/BackToTop";
import CompetitionExplorer from "@/components/competitions/CompetitionExplorer";
import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import TravelGoals from "@/components/competitions/TravelGoals";
import TravelStats from "@/components/competitions/TravelStats";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
import {
  countryGoals,
  finishedCompetitions,
  formatDateRange,
  getCompetitionHistory,
  getCompetitionsOverview,
  stateGoals,
  travelStats,
} from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "Competitions",
  description: "Where Ben Gottschalk is competing, delegating, and organizing next, plus every WCA competition he has attended, on a map.",
  path: "/cubing/competitions",
});

export default async function CompetitionsPage() {
  const [competitions, historyResult] = await Promise.all([getCompetitionsOverview(), getCompetitionHistory()]);
  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const upcoming = competitions.ok ? competitions.data.upcoming : [];
  // Competitions still running at their venue stay out of the past list.
  const history = historyResult.ok
    ? finishedCompetitions(historyResult.data.history, competitions.ok ? competitions.data : null, historyResult.data.utcToday)
        .map((entry) => ({ ...entry, date_range: formatDateRange(entry.start_date, entry.end_date) }))
    : [];

  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-4xl font-bold">Competitions</h1>
        <p className="mt-2 text-lg text-muted">Where I&apos;m competing, delegating, and organizing next, and everywhere I&apos;ve been.</p>
      </header>

      {competitions.ok ? (
        <>
          {ongoing.length > 0 && (
            <section aria-labelledby="ongoing-heading" className="space-y-4">
              <h2 id="ongoing-heading" className="scroll-mt-24 text-2xl font-bold">Happening now</h2>
              <OngoingCompetitions competitions={ongoing} />
            </section>
          )}
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <h2 id="upcoming-heading" className="text-2xl font-bold">Upcoming</h2>
            <UpcomingCompetitions competitions={upcoming} />
          </section>
        </>
      ) : (
        <div role="alert" className="alert alert-warning">
          Upcoming competitions couldn&apos;t be loaded from the WCA right now. Please try again later.
        </div>
      )}

      {historyResult.ok && (
        // Competitions underway count as coming up until they finish.
        <TravelGoals states={stateGoals(history, [...ongoing, ...upcoming])} countries={countryGoals(history, [...ongoing, ...upcoming])} />
      )}

      {historyResult.ok && history.length > 1 && <TravelStats stats={travelStats(history)} />}

      {historyResult.ok && <CompetitionExplorer ongoing={ongoing} upcoming={upcoming} history={history} />}

      <BackToTop />
    </div>
  )
}
