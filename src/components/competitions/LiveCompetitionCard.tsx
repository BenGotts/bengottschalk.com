import "@cubing/icons";
import ExternalLink from "@/components/ExternalLink";
import { WCA_ID } from "@/consts";
import CompetitionLocation from "./CompetitionLocation";
import LiveResults from "./LiveResults";
import LiveResultsProvider from "./LiveResultsProvider";
import ScheduleList from "./ScheduleList";
import { scheduleDays } from "./scheduleDays";
import {
    eventIconClass,
    eventName,
    getCompetitionSchedule,
    getLivePerson,
    hasStaffRole,
    sortEventIds,
    type Competition,
} from "@/lib/wca";

/** A competition happening now: its details beside my groups and staff assignments from the public WCIF. */
export default async function LiveCompetitionCard({ competition }: { competition: Competition }) {
    const { isDelegate, isOrganizer } = hasStaffRole(competition, WCA_ID);
    const [schedule, livePerson] = await Promise.all([getCompetitionSchedule(competition.id), getLivePerson(competition.id)]);
    const entries = schedule.ok && schedule.data ? schedule.data.entries : [];
    const competingIn = schedule.ok && schedule.data ? schedule.data.eventIds : [];

    const days = scheduleDays(entries);

    const person = livePerson.ok ? livePerson.data : null;

    return (
        <LiveResultsProvider person={person}>
            <article
                aria-labelledby={`live-${competition.id}`}
                className={`card border-2 border-error bg-base-200 ${days.length > 0 ? "lg:grid lg:grid-cols-[2fr_3fr]" : ""}`}
            >
                <div className="card-body gap-4 p-6">
                    <div className="space-y-1">
                        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-error">
                            <span className="status status-error animate-pulse" aria-hidden="true" /> Live
                        </p>
                        <h3 id={`live-${competition.id}`} className="text-2xl font-bold leading-tight">
                            <ExternalLink href={competition.url} className="link link-hover">
                                {competition.name}
                            </ExternalLink>
                        </h3>
                        <p className="text-muted">{competition.date_range}</p>
                    </div>

                    <CompetitionLocation city={competition.city} countryIso2={competition.country_iso2} />

                    {(isDelegate || isOrganizer) && (
                        <div className="flex gap-2">
                            {isDelegate && <span className="badge border-primary bg-primary/10 font-medium">Delegate</span>}
                            {isOrganizer && <span className="badge border-secondary bg-secondary/10 font-medium">Organizer</span>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <p className="text-sm text-muted">{competingIn.length > 0 ? "Competing in" : "Events"}</p>
                        <ul className="flex flex-wrap gap-2 text-2xl" aria-label={competingIn.length > 0 ? "Competing in" : "Events"}>
                            {sortEventIds(competingIn.length > 0 ? competingIn : competition.event_ids).map((id) => (
                                <li key={id}>
                                    <span className={eventIconClass(id)} title={eventName(id)} aria-hidden="true" />
                                    <span className="sr-only">{eventName(id)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-auto flex flex-wrap gap-3 pt-2">
                        <ExternalLink
                            href={`https://live.worldcubeassociation.org/link/competitions/${competition.id}`}
                            className="btn btn-error btn-sm"
                            arrow
                            iconClassName="-ml-1 size-[0.9em]"
                        >
                            Live results
                        </ExternalLink>
                        <ExternalLink href={competition.url} className="btn btn-ghost btn-sm" arrow iconClassName="-ml-1 size-[0.9em]">
                            Competition page
                        </ExternalLink>
                    </div>
                </div>

                {days.length > 0 && (
                    <section
                        aria-labelledby={`schedule-${competition.id}`}
                        className="border-t border-base-300 p-6 lg:border-t-0 lg:border-l"
                    >
                        <h4 id={`schedule-${competition.id}`} className="text-lg font-bold">My schedule</h4>
                        <ScheduleList days={days} />
                    </section>
                )}

                {person && (
                    <section className="border-t border-base-300 px-3 py-6 sm:p-6 lg:col-span-2">
                        <LiveResults person={person} />
                    </section>
                )}
            </article>
        </LiveResultsProvider>
    );
}
