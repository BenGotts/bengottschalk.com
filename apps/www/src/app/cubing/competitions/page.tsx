import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import BackToTop from "@/components/BackToTop";
import CompetitionExplorer from "@/components/competitions/CompetitionExplorer";
import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
import { finishedCompetitions, formatDateRange, getCompetitionHistory, getCompetitionsOverview, upcomingNumbers } from "@/lib/wca";
import { WCA_ID } from "@/consts";

export const metadata: Metadata = pageMetadata({
  title: "Competitions",
  description: "Where Ben Gottschalk is competing, delegating, and organizing next, plus every WCA competition he has attended.",
  path: "/cubing/competitions",
});

export default async function CompetitionsPage() {
  const [competitions, historyResult] = await Promise.all([getCompetitionsOverview(), getCompetitionHistory()]);
  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const upcoming = competitions.ok ? competitions.data.upcoming : [];
  // Competitions still running at their venue stay out of the past list.
  const finished = historyResult.ok
    ? finishedCompetitions(historyResult.data.history, competitions.ok ? competitions.data : null, historyResult.data.utcToday)
    : [];
  const history = finished.map((entry) => ({ ...entry, date_range: formatDateRange(entry.start_date, entry.end_date) }));
  // Which competition each coming one will be in my career, e.g. "158th competition".
  const numbers = historyResult.ok && competitions.ok ? upcomingNumbers(finished, competitions.data, WCA_ID) : undefined;

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
              <OngoingCompetitions competitions={ongoing} numbers={numbers} />
            </section>
          )}
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <h2 id="upcoming-heading" className="text-2xl font-bold">Upcoming</h2>
            <UpcomingCompetitions competitions={upcoming} numbers={numbers} />
          </section>
        </>
      ) : (
        <div role="alert" className="alert alert-warning">
          Upcoming competitions couldn&apos;t be loaded from the WCA right now. Please try again later.
        </div>
      )}

      {historyResult.ok && <CompetitionExplorer history={history} />}

      <BackToTop />
    </div>
  )
}
