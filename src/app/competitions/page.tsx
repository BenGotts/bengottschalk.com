import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
// import PastCompetitions from "@/components/competitions/PastCompetitions"
import { WCA_ID } from "@/consts";
import { Metadata } from 'next';
// import { Separator } from "@/components/ui/separator";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Competitions | bengottschalk.com",
  description: "List of competitions that Benjamin Gottschalk is attending.",
}

interface Competition {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  country_iso2: string;
  city: string;
  website: string;
}

interface UserInfo {
  upcoming_competitions: Competition[];
  ongoing_competitions: Competition[];
}

export default async function CompetitionsPage() {
  const userInfo = await fetch(`https://www.worldcubeassociation.org/api/v0/users/${WCA_ID}?upcoming_competitions=true&ongoing_competitions=true`)
  .then(response => response.json() as Promise<UserInfo>);

  
  // const userInfoPromise = fetch(`https://www.worldcubeassociation.org/api/v0/users/${WCA_ID}?upcoming_competitions=true&ongoing_competitions=true`)
  // .then(response => response.json());

  // const pastCompetitionsPromise = fetch(`https://www.worldcubeassociation.org/api/v0/persons/${WCA_ID}/competitions`)
  // .then(response => response.json());

  // const [userInfo, pastCompetitionsData] = await Promise.all([
  //   userInfoPromise,
  //   pastCompetitionsPromise
  // ]).catch(err => {
  //   console.error(err);
  //   return [ { upcoming_competitions: [], ongoing_competitions: [] }, [] ];
  // });

  const upcomingCompetitions = userInfo.upcoming_competitions.sort((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date));
  const ongoingCompetitions = userInfo.ongoing_competitions.sort((a, b) => a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date));
  // const pastCompetitions = pastCompetitionsData.sort((a, b) => b.start_date.localeCompare(a.start_date));

  return (
    <div className="m-2 sm:m-4 space-y-3 sm:space-y-4 flex-grow">
      <OngoingCompetitions competitions={ongoingCompetitions} />
      <UpcomingCompetitions competitions={upcomingCompetitions} />
      {/* <Separator className="my-2 sm:my-4" />
      <PastCompetitions competitions={pastCompetitions} /> */}
    </div>
  )
}


