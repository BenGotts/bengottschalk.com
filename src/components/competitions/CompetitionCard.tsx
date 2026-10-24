import "@cubing/icons";
import { WCA_ID } from "@/consts";
import CompetitionLocation from "./CompetitionLocation";
import { eventIconClass, eventName, hasStaffRole, sortEventIds, type Competition } from "@/lib/wca";
import ExternalLink from "@/components/ExternalLink";

export default function CompetitionCard({ competition }: { competition: Competition }) {
    const { isDelegate, isOrganizer } = hasStaffRole(competition, WCA_ID);

    return (
        <article className="card group relative border border-base-300 bg-base-200 transition-colors hover:border-primary">
            <div className="card-body gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="card-title text-lg leading-snug">
                        {/* Stretched link: the whole card opens the competition. */}
                        <ExternalLink
                            href={competition.url}
                            className="after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                        >
                            {competition.name}
                        </ExternalLink>
                    </h3>
                    <span className="shrink-0 text-sm text-muted">{competition.date_range}</span>
                </div>

                <CompetitionLocation city={competition.city} countryIso2={competition.country_iso2} />

                {(isDelegate || isOrganizer) && (
                    <div className="flex gap-2">
                        {isDelegate && <span className="badge border-primary bg-primary/10 font-medium">Delegate</span>}
                        {isOrganizer && <span className="badge border-secondary bg-secondary/10 font-medium">Organizer</span>}
                    </div>
                )}

                <ul className="flex flex-wrap gap-2 text-xl" aria-label="Events">
                    {sortEventIds(competition.event_ids).map((id) => (
                        <li key={id}>
                            <span className={eventIconClass(id)} title={eventName(id)} aria-hidden="true" />
                            <span className="sr-only">{eventName(id)}</span>
                        </li>
                    ))}
                </ul>

                {competition.results_posted_at && (
                    <div className="flex gap-4 border-t border-base-300 pt-3 text-sm font-medium">
                        <ExternalLink
                            href={`https://www.worldcubeassociation.org/competitions/${competition.id}/results/all`}
                            className="link link-hover relative z-10 text-success"
                            arrow
                        >
                            View results
                        </ExternalLink>
                    </div>
                )}
            </div>
        </article>
    );
}
