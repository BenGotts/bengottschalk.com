import CompetitionCard from "./CompetitionCard";
import type { WcaCompetition } from "@/lib/types";

export default function UpcomingCompetitions({ competitions }: { competitions: WcaCompetition[] }) {
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
