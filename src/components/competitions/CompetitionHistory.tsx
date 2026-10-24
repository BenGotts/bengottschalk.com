import CompetitionLocation from "./CompetitionLocation";
import { formatIsoDate, groupByYear, type HistoryEntry } from "@/lib/wca";
import ExternalLink from "@/components/ExternalLink";

/** Past competitions grouped by year; the newest year starts open. */
export default function CompetitionHistory({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-3">
      {groupByYear(history).map(({ year, entries }, index) => (
        <details key={year} open={index === 0} className="collapse collapse-arrow border border-base-300 bg-base-200">
          <summary className="collapse-title font-display text-lg font-bold">
            {year} <span className="font-sans text-sm font-normal text-muted">· {entries.length} competitions</span>
          </summary>
          <ul className="collapse-content divide-y divide-base-300">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                <span className="w-28 shrink-0 text-sm text-muted">{formatIsoDate(entry.start_date)}</span>
                <ExternalLink href={entry.url} className="link link-hover min-w-0 flex-1 font-medium">
                  {entry.name}
                </ExternalLink>
                <CompetitionLocation city={entry.city} countryIso2={entry.country_iso2} />
                <span className="flex gap-1.5">
                  {entry.competed && <span className="badge badge-sm border-primary bg-primary/10">Competed</span>}
                  {entry.delegated && <span className="badge badge-sm border-secondary bg-secondary/10">Delegated</span>}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
