import CompetitionCard from "./CompetitionCard";
import type { Competition } from "@/lib/wca";

export default function OngoingCompetitions({ competitions }: { competitions: Competition[] }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            {competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} isOngoing={true} />
            ))}
        </div>
    );
}
