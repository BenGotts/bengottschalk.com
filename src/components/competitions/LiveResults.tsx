"use client";

import "@cubing/icons";
// Import pure modules directly: the wca index also exports server-only API code.
import { eventIconClass } from "@/lib/wca/events";
import { formatResult } from "@/lib/wca/format";
import { livePersonUrl, type LivePerson, type LiveResult } from "@/lib/wca/live";
import { useLiveResults } from "./LiveResultsProvider";
import ExternalLink from "@/components/ExternalLink";

// DNF and DNS rank worst.
const attemptRank = (value: number) => (value > 0 ? value : Number.POSITIVE_INFINITY);

// Every time cell reserves room for a record tag, so times line up whether or not they have one.
const TAG_SLOT = "inline-block w-6 pl-1 text-left";

/** A single or average, coloured and tagged when it's a record (PR green; NR, CR and WR amber). */
function TimeCell({ value, tag }: { value: string; tag: string | null }) {
  const color = !tag ? "" : tag === "PR" ? "text-success" : "text-warning";
  return (
    <td className="text-right font-mono font-semibold whitespace-nowrap">
      <span className={color}>{value}</span>
      <span className={`${TAG_SLOT} align-super font-sans text-[0.625rem] font-bold ${color}`}>{tag}</span>
    </td>
  );
}

/** WCA style: in a full average of 5, the best and worst attempts are in parentheses. */
function attemptLabels(result: LiveResult, eventId: string): string[] {
  const values = result.attempts.map((attempt) => attempt.result);
  const labels = values.map((value) => formatResult(eventId, value));
  if (values.length !== 5) return labels;
  const order = values.map((_, i) => i).toSorted((a, b) => attemptRank(values[a]) - attemptRank(values[b]) || a - b);
  const dropped = new Set([order[0], order.at(-1)]);
  return labels.map((label, i) => (dropped.has(i) ? `(${label})` : label));
}

function ResultsTable({ results }: { results: LiveResult[] }) {
  const attemptColumns = Math.max(...results.map((r) => r.round.format.numberOfAttempts));
  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-xs sm:table-sm">
        <thead>
          <tr className="text-muted">
            <th scope="col">Event</th>
            <th scope="col" className="hidden sm:table-cell">Round</th>
            <th scope="col" className="text-right">#</th>
            <th scope="col" className="text-right">Single<span className={TAG_SLOT} /></th>
            <th scope="col" className="text-right">Average<span className={TAG_SLOT} /></th>
            {Array.from({ length: attemptColumns }, (_, i) => (
              <th key={i} scope="col" className="text-right">{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const { round } = result;
            const eventId = round.competitionEvent.event.id;
            const labels = attemptLabels(result, eventId);
            return (
              <tr key={result.id} className="hover:bg-base-300/50">
                <th scope="row" className="font-medium whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span className={`${eventIconClass(eventId)} text-lg`} aria-hidden="true" />
                    {round.competitionEvent.event.name}
                  </span>
                  {/* On phones the round sits under the event, keeping times in view. */}
                  <span className="block pl-7 text-xs font-normal text-muted sm:hidden">{round.name}</span>
                </th>
                <td className="hidden whitespace-nowrap text-muted sm:table-cell">{round.name}</td>
                {/* Like WCA Live, an advancing place is green. */}
                <td className={`text-right font-mono ${result.advancing ? "bg-success/15 font-semibold text-success" : ""}`}>
                  {result.ranking}
                  {result.advancing && <span className="sr-only"> (advancing)</span>}
                </td>
                <TimeCell value={result.best ? formatResult(eventId, result.best) : ""} tag={result.singleRecordTag} />
                <TimeCell value={result.average ? formatResult(eventId, result.average, "average") : ""} tag={result.averageRecordTag} />
                {Array.from({ length: attemptColumns }, (_, i) => (
                  <td key={i} className="text-right font-mono whitespace-nowrap text-muted">{labels[i] ?? ""}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** My results so far, from WCA Live via `LiveResultsProvider`. */
export default function LiveResults({ person }: { person: LivePerson }) {
  const { results, failed } = useLiveResults();

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-3 sm:px-0">
        <h4 className="text-lg font-bold">My results</h4>
        <ExternalLink href={livePersonUrl(person)} className="link link-hover text-sm" arrow>
          On WCA Live
        </ExternalLink>
      </div>
      <div className="mt-3" aria-live="polite">
        {results === null ? (
          failed ? (
            <p className="text-sm text-muted">Results couldn&apos;t be loaded from WCA Live right now.</p>
          ) : (
            <div className="skeleton h-28" aria-busy="true" />
          )
        ) : results.length === 0 ? (
          <p className="text-sm text-muted">No results yet. They&apos;ll appear here as my rounds are entered.</p>
        ) : (
          <ResultsTable results={results} />
        )}
      </div>
    </div>
  );
}
