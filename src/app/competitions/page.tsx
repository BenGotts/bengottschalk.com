import OngoingCompetitions from "@/components/competitions/OngoingCompetitions";
import UpcomingCompetitions from "@/components/competitions/UpcomingCompetitions"
// import PastCompetitions from "@/components/competitions/PastCompetitions"
import { WCA_ID } from "@/consts";
import { Metadata } from 'next';
// import { Separator } from "@/components/ui/separator";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Competitions | Benjamin Gottschalk",
  description: "Rubik's Cube competitions that Benjamin Gottschalk is attending as a competitor, delegate, and organizer.",
}

import { Competition } from "@/lib/types";

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
    <div className="flex-grow bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Rubik's Cube Competitions
          </h1>
          <p className="text-xl text-blue-100 leading-relaxed">
            As an avid speedcuber, I compete in and organize Rubik's Cube competitions worldwide. 
            Follow my competitive journey and see where I'll be next!
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a 
              href="https://wca.bengottschalk.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all hover:scale-105 shadow-lg"
            >
              View WCA Profile
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Competitions Content */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="space-y-12">
          {ongoingCompetitions.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  🔴 Live Now
                </h2>
                <p className="text-gray-600">
                  Currently competing at these events
                </p>
              </div>
              <OngoingCompetitions competitions={ongoingCompetitions} />
            </div>
          )}

          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Upcoming Competitions
              </h2>
              <p className="text-gray-600">
                Events I'm registered for or organizing
              </p>
            </div>
            <UpcomingCompetitions competitions={upcomingCompetitions} />
          </div>
        </div>
      </div>
      {/* <Separator className="my-2 sm:my-4" />
      <PastCompetitions competitions={pastCompetitions} /> */}
    </div>
  )
}
