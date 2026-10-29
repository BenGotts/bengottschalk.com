import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import CompetitionMapLoader from "@/components/competitions/CompetitionMapLoader";
import { CountryProgress, StateProgress } from "@/components/competitions/PlaceProgress";
import TravelStats from "@/components/competitions/TravelStats";
import {
  countryGoals,
  finishedCompetitions,
  getCompetitionHistory,
  getCompetitionsOverview,
  groupMapLocations,
  stateGoals,
  travelStats,
} from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "Places",
  description: "Every WCA competition Ben Gottschalk has competed in or delegated, on a map, with the US states and countries he has competed in.",
  path: "/cubing/places",
});

export default async function PlacesPage() {
  const [competitions, historyResult] = await Promise.all([getCompetitionsOverview(), getCompetitionHistory()]);
  const ongoing = competitions.ok ? competitions.data.ongoing : [];
  const upcoming = competitions.ok ? competitions.data.upcoming : [];
  const history = historyResult.ok
    ? finishedCompetitions(historyResult.data.history, competitions.ok ? competitions.data : null, historyResult.data.utcToday)
    : [];
  // Competitions underway count as coming up until they finish.
  const comingUp = [...ongoing, ...upcoming];
  const locations = groupMapLocations([
    ...ongoing.map((competition) => ({ competition, status: "ongoing" as const })),
    ...upcoming.map((competition) => ({ competition, status: "upcoming" as const })),
    ...history.map((competition) => ({ competition, status: "past" as const })),
  ]);

  return (
    <div className="space-y-14">
      <header>
        <h1 className="text-4xl font-bold">Places</h1>
        <p className="mt-2 text-lg text-muted">Everywhere I&apos;ve competed and delegated, and how far I&apos;ve travelled to get there.</p>
      </header>

      {historyResult.ok ? (
        <>
          <section aria-label="Map" id="map" className="scroll-mt-24">
            <CompetitionMapLoader locations={locations} />
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <StateProgress states={stateGoals(history, comingUp)} />
            <CountryProgress countries={countryGoals(history, comingUp)} />
          </div>

          {history.length > 1 && <TravelStats stats={travelStats(history)} />}
        </>
      ) : (
        <div role="alert" className="alert alert-warning">
          Competition history couldn&apos;t be loaded from the WCA right now. Please try again later.
        </div>
      )}
    </div>
  );
}
