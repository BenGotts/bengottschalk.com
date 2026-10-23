import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import StatTile from "@/components/StatTile";
import CompetitionHistory from "@/components/competitions/CompetitionHistory";
import CompetitionMapLoader from "@/components/competitions/CompetitionMapLoader";
import CompetitionSchedule from "@/components/competitions/CompetitionSchedule";
import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
import { formatIsoDate, getCompetitionHistory, getCompetitionsOverview, groupMapLocations, type MapStatus } from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "Competitions",
  description: "Where Ben Gottschalk is competing, delegating, and organizing next, plus every WCA competition he has attended, on a map.",
  path: "/competitions",
});

export default async function CompetitionsPage() {
  const [competitions, historyResult] = await Promise.all([getCompetitionsOverview(), getCompetitionHistory()]);
  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const upcoming = competitions.ok ? competitions.data.upcoming : [];
  const history = historyResult.ok ? historyResult.data.history : [];

  const mapLocations = groupMapLocations([
    ...ongoing.map((competition) => ({ competition, status: "ongoing" as MapStatus })),
    ...upcoming.map((competition) => ({ competition, status: "upcoming" as MapStatus })),
    ...history.map((entry) => ({ competition: { ...entry, date_range: formatIsoDate(entry.start_date) }, status: "past" as MapStatus })),
  ]);

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
              <h2 id="ongoing-heading" className="text-2xl font-bold">Happening now</h2>
              <OngoingCompetitions competitions={ongoing} />
              {ongoing.map((competition) => (
                <CompetitionSchedule key={competition.id} competitionId={competition.id} competitionName={competition.name} />
              ))}
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
        <>
          <section aria-labelledby="stats-heading" className="space-y-4">
            <h2 id="stats-heading" className="text-2xl font-bold">By the numbers</h2>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile value={historyResult.data.stats.competed} label="Competed in" />
              <StatTile value={historyResult.data.stats.delegated} label="Delegated" />
              <StatTile value={historyResult.data.stats.countries} label="Countries" />
              <StatTile value={historyResult.data.stats.usStates} label="US states" />
            </div>
          </section>

          <section aria-labelledby="map-heading" className="space-y-4">
            <h2 id="map-heading" className="text-2xl font-bold">Map</h2>
            <CompetitionMapLoader locations={mapLocations} />
          </section>

          <section aria-labelledby="past-heading" className="space-y-4">
            <h2 id="past-heading" className="text-2xl font-bold">Past competitions</h2>
            <CompetitionHistory history={history} />
          </section>
        </>
      )}
    </div>
  )
}
