import CompetitionCard from "./CompetitionCard";
import type { Competition } from "@/lib/wca";

export default function UpcomingCompetitions({ competitions }: { competitions: Competition[] }) {
    if (competitions.length === 0) {
        return <p className="py-8 text-center text-muted">No upcoming competitions right now.</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} />
            ))}
        </div>
    );
}
