"use client";

import CompetitionCard from "./CompetitionCard";
import { Competition } from "@/lib/types";

interface UpcomingCompetitionsProps {
  competitions: Competition[];
}

export default function UpcomingCompetitions({ competitions }: UpcomingCompetitionsProps) {
    if (!competitions || competitions.length === 0) {
        return <div className="text-center text-gray-500 py-8">No upcoming competitions found.</div>;
    }

    return (
        <div className="space-y-4">
            {competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} />
            ))}
        </div>
    );
}


