import LiveCompetitionCard from "./LiveCompetitionCard";
import type { Competition, CompetitionNumbers } from "@/lib/wca";

export default function OngoingCompetitions({ competitions, numbers }: { competitions: Competition[]; numbers?: Map<string, CompetitionNumbers> }) {
    return (
        <div className="space-y-4">
            {competitions.map((comp) => (
                <LiveCompetitionCard key={comp.id} competition={comp} numbers={numbers?.get(comp.id)} />
            ))}
        </div>
    );
}
