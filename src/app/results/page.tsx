import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import StatTile from "@/components/StatTile";
import PrTable from "@/components/results/PrTable";
import { eventName, formatIsoDate, formatResult, getPerson, getRegionalRecords } from "@/lib/wca";
import ExternalLink from "@/components/ExternalLink";

export const metadata: Metadata = pageMetadata({
  title: "Results",
  description: "Ben Gottschalk's official WCA personal records in every event, with national, continental and world ranks, medals and records.",
  path: "/results",
});

export default async function ResultsPage() {
  const [person, regionalRecords] = await Promise.all([getPerson(), getRegionalRecords()]);

  if (!person.ok) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-bold">Results</h1>
        <div role="alert" className="alert alert-warning">Results couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      </div>
    );
  }

  const { medals, records, competition_count, total_solves, personal_records, person: profile } = person.data;
  const recordRows = regionalRecords.ok
    ? regionalRecords.data.flatMap((result) => [
        ...(result.regional_single_record ? [{ result, kind: "single" as const, value: result.best, record: result.regional_single_record }] : []),
        ...(result.regional_average_record ? [{ result, kind: "average" as const, value: result.average, record: result.regional_average_record }] : []),
      ])
    : [];

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Results</h1>
          <p className="mt-2 text-lg text-muted">My official WCA personal records. Pick an event to see how its PRs improved.</p>
        </div>
        <ExternalLink href={profile.url} className="btn border-base-300 bg-base-200 hover:border-primary" arrow iconClassName="-ml-1 size-[0.9em]">
          WCA profile
        </ExternalLink>
      </header>

      <section aria-label="Career stats" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile value={competition_count} label="Competitions" />
        <StatTile value={total_solves.toLocaleString("en-US")} label="Official solves" />
        <StatTile
          value={medals.total}
          label={
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-gold" aria-hidden="true" />{medals.gold} gold</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-silver" aria-hidden="true" />{medals.silver} silver</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-bronze" aria-hidden="true" />{medals.bronze} bronze</span>
            </span>
          }
        />
        <StatTile value={records.total} label={records.total === 1 ? "Regional record" : "Regional records"} />
      </section>

      <section aria-labelledby="prs-heading" className="space-y-4">
        <h2 id="prs-heading" className="text-2xl font-bold">Personal records</h2>
        <PrTable records={personal_records} />
      </section>

      {recordRows.length > 0 && (
        <section aria-labelledby="records-heading" className="space-y-4">
          <h2 id="records-heading" className="text-2xl font-bold">Records I&apos;ve set</h2>
          <ul className="space-y-3">
            {recordRows.map(({ result, kind, value, record }) => (
              <li key={`${result.id}-${kind}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-box border border-base-300 bg-base-200 p-4">
                <span className="badge border-accent bg-accent/10 font-semibold">{record}</span>
                <span className="font-semibold">{eventName(result.event_id)} {kind}</span>
                <span className="font-mono">{formatResult(result.event_id, value, kind)}</span>
                <span className="text-sm text-muted">{result.competition_short_name} · {formatIsoDate(result.competition_start_date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
