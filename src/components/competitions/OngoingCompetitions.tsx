import CompetitionCard from "./CompetitionCard";
import type { WcaCompetition } from "@/lib/types";

export default function OngoingCompetitions({ competitions }: { competitions: WcaCompetition[] }) {
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