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
    <div className="m-2 sm:m-4 space-y-3 sm:space-y-4 grow">
      {competitions.ok ? (
        <>
          <OngoingCompetitions competitions={competitions.data.ongoing} />
          <UpcomingCompetitions competitions={competitions.data.upcoming} />
        </>
      ) : (
        <div className="text-center text-gray-500 py-8">Competitions couldn't be loaded from the WCA right now.</div>
      )}
    </div>
  )
}
