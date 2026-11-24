"use client";

import { FaArrowsRotate, FaTrophy } from "react-icons/fa6";
import type { CompetitionResultsState } from "@/lib/wca/useCompetitionResults";

export type SourceFilterValue = "all" | "home" | "competition";

const OPTIONS: { value: SourceFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "competition", label: "Competition" },
];

const timeAgo = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function ago(ms: number): string {
  const minutes = Math.round((ms - Date.now()) / 60_000);
  if (minutes > -60) return timeAgo.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  return hours > -48 ? timeAgo.format(hours, "hour") : timeAgo.format(Math.round(hours / 24), "day");
}

/**
 * Which solves the list and stats include, plus the state of the WCA results
 * (only shown once a WCA ID is set).
 */
export default function SourceFilter({ value, onChange, results }: { value: SourceFilterValue; onChange: (value: SourceFilterValue) => void; results: CompetitionResultsState }) {
  if (!results.wcaId) return null;
  return (
    <div className="space-y-1.5">
      <fieldset className="join w-full">
        <legend className="sr-only">Show solves</legend>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`btn join-item btn-xs grow ${value === option.value ? "btn-primary" : ""}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.value === "competition" && <FaTrophy aria-hidden />}{option.label}
          </button>
        ))}
      </fieldset>
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <output>
          {results.loading
            ? `Loading WCA results${results.progress ? ` (${results.progress.done}/${results.progress.total} competitions)` : "…"}`
            : results.error ?? (results.liveCompetitionIds.length > 0 ? "Following WCA Live" : results.refreshedAt ? `WCA results ${ago(results.refreshedAt)}` : "")}
        </output>
        <button type="button" className="btn btn-ghost btn-xs" onClick={results.refresh} disabled={results.loading}>
          <FaArrowsRotate aria-hidden /> Refresh results
        </button>
      </div>
    </div>
  );
}
