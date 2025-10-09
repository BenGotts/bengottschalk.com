"use client";

import CompetitionCard from "./CompetitionCard";
import { Competition } from "@/lib/types";

interface OngoingCompetitionsProps {
  competitions: Competition[];
}

export default function OngoingCompetitions({ competitions }: OngoingCompetitionsProps) {
    if (!competitions || competitions.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} isOngoing={true} />
            ))}
        </div>
    );
}