import type { Metadata } from "next";
import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
import { getCompetitionsOverview } from "@/lib/wca";

export const metadata: Metadata = {
  title: "Competitions | bengottschalk.com",
  description: "List of competitions that Benjamin Gottschalk is attending.",
}

export default async function CompetitionsPage() {
  const competitions = await getCompetitionsOverview();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-bold">Competitions</h1>
        <p className="mt-2 text-lg text-muted">Where I&apos;m competing, delegating, and organizing next.</p>
      </header>

      {competitions.ok ? (
        <>
          {competitions.data.ongoing.length > 0 && (
            <section aria-labelledby="ongoing-heading" className="space-y-4">
              <h2 id="ongoing-heading" className="text-2xl font-bold">Happening now</h2>
              <OngoingCompetitions competitions={competitions.data.ongoing} />
            </section>
          )}
          <section aria-labelledby="upcoming-heading" className="space-y-4">
            <h2 id="upcoming-heading" className="text-2xl font-bold">Upcoming</h2>
            <UpcomingCompetitions competitions={competitions.data.upcoming} />
          </section>
        </>
      ) : (
        <div role="alert" className="alert alert-warning">
          Competitions couldn&apos;t be loaded from the WCA right now. Please try again later.
        </div>
      )}
    </div>
  )
}
