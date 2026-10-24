import LiveCompetitionCard from "./LiveCompetitionCard";
import type { Competition } from "@/lib/wca";

export default function OngoingCompetitions({ competitions }: { competitions: Competition[] }) {
    return (
        <div className="space-y-4">
            {competitions.map((comp) => (
                <LiveCompetitionCard key={comp.id} competition={comp} />
            ))}
        </div>
    );
}
