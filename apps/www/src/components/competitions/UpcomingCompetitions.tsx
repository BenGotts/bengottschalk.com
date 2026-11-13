import CompetitionCard from "./CompetitionCard";
import type { Competition, CompetitionNumbers } from "@/lib/wca";

export default function UpcomingCompetitions({ competitions, numbers }: { competitions: Competition[]; numbers?: Map<string, CompetitionNumbers> }) {
    if (competitions.length === 0) {
        return <p className="py-8 text-center text-muted">No upcoming competitions right now.</p>;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {competitions.map((comp) => (
                <CompetitionCard key={comp.id} competition={comp} numbers={numbers?.get(comp.id)} />
            ))}
        </div>
    );
}
