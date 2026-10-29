import CompetitionLocation from "./CompetitionLocation";
import { groupByYear, type HistoryEntry } from "@/lib/wca/competitions";
import ExternalLink from "@/components/ExternalLink";

/** A history entry with its date already formatted, so this can render in the browser. */
export type DatedHistoryEntry = HistoryEntry & { date_range: string };

/**
 * Past competitions grouped by year. The newest year starts open, or every
 * year while the list is filtered.
 */
export default function CompetitionHistory({ history, expandAll = false }: { history: DatedHistoryEntry[]; expandAll?: boolean }) {
  return (
    <div className="space-y-3">
      {groupByYear(history).map(({ year, entries }, index) => (
        // Keyed by expandAll so toggling it re-applies the default open state.
        <details key={`${year}-${expandAll}`} open={expandAll || index === 0} className="collapse collapse-arrow border border-base-300 bg-base-200">
          <summary className="collapse-title font-display text-lg font-bold">
            {year} <span className="font-sans text-sm font-normal text-muted">· {entries.length} {entries.length === 1 ? "competition" : "competitions"}</span>
          </summary>
          <ul className="collapse-content divide-y divide-base-300">
            {entries.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 py-3">
                <span className="min-w-0 flex-1 basis-56">
                  <ExternalLink href={entry.url} className="link link-hover font-medium">
                    {entry.name}
                  </ExternalLink>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
                    {entry.date_range}
                    <CompetitionLocation city={entry.city} countryIso2={entry.country_iso2} />
                  </span>
                </span>
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
