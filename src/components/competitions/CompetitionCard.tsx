import "@cubing/icons";
import { ReactCountryFlag } from "react-country-flag";
import { LuArrowUpRight } from "react-icons/lu";
import { WCA_ID } from "@/consts";
import { eventIconClass, eventName, hasStaffRole, sortEventIds, type Competition } from "@/lib/wca";

interface CompetitionCardProps {
    competition: Competition;
    isOngoing?: boolean;
}

export default function CompetitionCard({ competition, isOngoing = false }: CompetitionCardProps) {
    const { isDelegate, isOrganizer } = hasStaffRole(competition, WCA_ID);

    return (
        <article
            className={`card group relative border bg-base-200 transition-colors ${
                isOngoing ? "border-2 border-error" : "border-base-300 hover:border-primary"
            }`}
        >
            <div className="card-body gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                    <h3 className="card-title text-lg leading-snug">
                        {isOngoing && <span className="status status-error animate-pulse" aria-hidden="true" />}
                        {/* Stretched link: the whole card opens the competition. */}
                        <a
                            href={competition.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                        >
                            {competition.name}
                            {isOngoing && <span className="sr-only"> (happening now)</span>}
                        </a>
                    </h3>
                    <span className="shrink-0 text-sm text-muted">{competition.date_range}</span>
                </div>

                <p className="flex items-center gap-1.5 text-sm text-muted">
                    {competition.city}
                    <ReactCountryFlag countryCode={competition.country_iso2} svg aria-label={competition.country_iso2} />
                </p>

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

                {(isOngoing || competition.results_posted_at) && (
                    <div className="flex gap-4 border-t border-base-300 pt-3 text-sm font-medium">
                        {isOngoing && (
                            <a
                                href={`https://live.worldcubeassociation.org/link/competitions/${competition.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-hover relative z-10 inline-flex items-center gap-1 text-error"
                            >
                                Live results <LuArrowUpRight aria-hidden="true" />
                            </a>
                        )}
                        {competition.results_posted_at && (
                            <a
                                href={`https://www.worldcubeassociation.org/competitions/${competition.id}/results/all`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-hover relative z-10 inline-flex items-center gap-1 text-success"
                            >
                                View results <LuArrowUpRight aria-hidden="true" />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </article>
    );
}
