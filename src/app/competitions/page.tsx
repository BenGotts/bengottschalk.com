import type { Metadata } from "next";
import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
import { WCA_ID } from "@/consts";
import type { WcaUserCompetitions } from "@/lib/types";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Competitions | bengottschalk.com",
  description: "List of competitions that Benjamin Gottschalk is attending.",
}

export default async function CompetitionsPage() {
  const userInfo = await fetch(`https://www.worldcubeassociation.org/api/v0/users/${WCA_ID}?upcoming_competitions=true&ongoing_competitions=true`)
  .then(response => response.json() as Promise<WcaUserCompetitions>);

  const upcomingCompetitions = userInfo.upcoming_competitions.toSorted((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date));
  const ongoingCompetitions = userInfo.ongoing_competitions.toSorted((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date));

  return (
    <div className="m-2 sm:m-4 space-y-3 sm:space-y-4 grow">
      <OngoingCompetitions competitions={ongoingCompetitions} />
      <UpcomingCompetitions competitions={upcomingCompetitions} />
    </div>
  )
}
