import CompetitionCard from "./CompetitionCard";
import type { Competition } from "@/lib/wca";

export default function UpcomingCompetitions({ competitions }: { competitions: Competition[] }) {
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
