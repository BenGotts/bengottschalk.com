"use client";

import { FaTrophy } from "react-icons/fa6";

export type SourceFilterValue = "all" | "home" | "competition";

const OPTIONS: { value: SourceFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "home", label: "Home" },
  { value: "competition", label: "Competition" },
];

/**
 * Which solves the list and stats include: all, home or competition (only
 * shown when signed in with a WCA ID). Refreshing the WCA results is in the
 * account menu and Settings, next to cloud sync.
 */
export default function SourceFilter({ value, onChange, wcaId }: { value: SourceFilterValue; onChange: (value: SourceFilterValue) => void; wcaId: string | null }) {
  if (!wcaId) return null;
  return (
    <div>
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
    </div>
  );
}
