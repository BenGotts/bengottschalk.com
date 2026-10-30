import Link from "next/link";
import { LuArrowRight } from "react-icons/lu";
import CompetitionLocation from "./CompetitionLocation";
import LiveNowNext from "./LiveNowNext";
import LiveResultsProvider from "./LiveResultsProvider";
import { scheduleDays } from "./scheduleDays";
import { getCompetitionSchedule, getLivePerson, type Competition } from "@/lib/wca";
import ExternalLink from "@/components/ExternalLink";

/** A compact live competition for the home page; the full schedule and results are on /cubing/competitions. */
export default async function LiveCompetitionSummary({ competition }: { competition: Competition }) {
    const [schedule, livePerson] = await Promise.all([getCompetitionSchedule(competition.id), getLivePerson(competition.id)]);
    const items = scheduleDays(schedule.ok && schedule.data ? schedule.data.entries : []).flatMap((day) => day.items);

    return (
        <LiveResultsProvider person={livePerson.ok ? livePerson.data : null}>
            <article
                aria-labelledby={`live-summary-${competition.id}`}
                className="card border-2 border-error bg-base-200 md:grid md:grid-cols-[2fr_3fr]"
            >
                <div className="card-body gap-3 p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-error">
                        <span className="status status-error animate-pulse" aria-hidden="true" /> Live
                    </p>
                    <h3 id={`live-summary-${competition.id}`} className="text-xl font-bold leading-tight">
                        <ExternalLink href={competition.url} className="link link-hover">
                            {competition.name}
                        </ExternalLink>
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                        <span>{competition.date_range}</span>
                        <CompetitionLocation city={competition.city} countryIso2={competition.country_iso2} />
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                        <Link href="/cubing/competitions#ongoing-heading" className="btn btn-error btn-sm">
                            Schedule &amp; results <LuArrowRight aria-hidden="true" />
                        </Link>
                        <ExternalLink
                            href={`https://live.worldcubeassociation.org/link/competitions/${competition.id}`}
                            className="btn btn-ghost btn-sm"
                            arrow
                            iconClassName="-ml-1 size-[0.9em]"
                        >
                            Live results
                        </ExternalLink>
                    </div>
                </div>

                {items.length > 0 && (
                    <div className="flex flex-col justify-center border-t border-base-300 p-5 md:border-t-0 md:border-l">
                        <LiveNowNext items={items} />
                    </div>
                )}
            </article>
        </LiveResultsProvider>
    );
}
