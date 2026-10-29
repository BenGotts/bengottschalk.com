"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useDeferredValue, useEffect, useMemo, useState } from "react";
import { LuSearch, LuX } from "react-icons/lu";
// Import the pure module directly: the wca index also exports server-only API code.
import { groupMapLocations, historyStats, type MapStatus } from "@/lib/wca/competitions";
import type { Competition } from "@/lib/wca";
import CompetitionHistory, { type DatedHistoryEntry } from "./CompetitionHistory";
import CompetitionMapLoader from "./CompetitionMapLoader";

type Role = "all" | "competed" | "delegated";
const ROLES: { role: Role; label: string }[] = [
  { role: "all", label: "All" },
  { role: "competed", label: "Competed" },
  { role: "delegated", label: "Delegated" },
];
const isRole = (value: string | null): value is Role => ROLES.some((r) => r.role === value);

/**
 * Follows `?role=` in the URL (e.g. from the stat tiles). Kept in its own
 * Suspense boundary so reading search params doesn't stop the history from
 * being prerendered.
 */
function RoleFromUrl({ onRole }: { onRole: (role: Role) => void }) {
  const role = useSearchParams().get("role");
  useEffect(() => {
    if (isRole(role)) onRole(role);
  }, [role, onRole]);
  return null;
}

/**
 * The map and the past competitions, filtered together by role and by a
 * search of names and cities. Upcoming and ongoing competitions always stay
 * on the map.
 */
export default function CompetitionExplorer({ ongoing, upcoming, history }: {
  ongoing: Competition[];
  upcoming: Competition[];
  history: DatedHistoryEntry[];
}) {
  const [role, setRole] = useState<Role>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return history.filter(
      (entry) =>
        (role === "all" || entry[role]) &&
        (!needle || entry.name.toLowerCase().includes(needle) || entry.city.toLowerCase().includes(needle)),
    );
  }, [history, role, deferredQuery]);
  const filtering = role !== "all" || deferredQuery.trim() !== "";
  const places = historyStats(filtered);

  const locations = useMemo(
    () =>
      groupMapLocations([
        ...ongoing.map((competition) => ({ competition, status: "ongoing" as MapStatus })),
        ...upcoming.map((competition) => ({ competition, status: "upcoming" as MapStatus })),
        ...filtered.map((competition) => ({ competition, status: "past" as MapStatus })),
      ]),
    [ongoing, upcoming, filtered],
  );

  const chooseRole = (next: Role) => {
    setRole(next);
    // Keep the choice in the URL so it can be shared, without adding history entries.
    const url = new URL(window.location.href);
    if (next === "all") url.searchParams.delete("role");
    else url.searchParams.set("role", next);
    url.hash = "";
    window.history.replaceState(null, "", url);
  };

  return (
    <section aria-labelledby="past-heading" className="space-y-5">
      <Suspense fallback={null}>
        <RoleFromUrl onRole={setRole} />
      </Suspense>

      <div className="space-y-1">
        <h2 id="past-heading" className="scroll-mt-24 text-2xl font-bold">Past competitions</h2>
        <p className="text-sm text-muted" aria-live="polite">
          {filtering ? `${filtered.length} of ${history.length}` : history.length} {history.length === 1 ? "competition" : "competitions"}
          {" · "}{places.countries} {places.countries === 1 ? "country" : "countries"}
          {places.usStates > 0 && <> · {places.usStates} US {places.usStates === 1 ? "state" : "states"}</>}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="join">
          <legend className="sr-only">Show competitions where I</legend>
          {ROLES.map((r) => (
            <button
              key={r.role}
              type="button"
              aria-pressed={role === r.role}
              onClick={() => chooseRole(r.role)}
              className={`btn btn-sm join-item ${role === r.role ? "btn-primary" : "border-base-300 bg-base-200"}`}
            >
              {r.label}
            </button>
          ))}
        </fieldset>
        <label className="input input-sm w-full border-base-300 bg-base-200 sm:w-64">
          <LuSearch className="text-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or city"
            aria-label="Search past competitions by name or city"
          />
        </label>
      </div>

      <div id="map" className="scroll-mt-24">
        <CompetitionMapLoader locations={locations} />
      </div>

      {filtered.length > 0 ? (
        <CompetitionHistory history={filtered} expandAll={filtering} />
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-box border border-base-300 bg-base-200 py-10 text-center">
          <p className="text-muted">No past competitions match.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              chooseRole("all");
            }}
            className="btn btn-sm border-base-300 bg-base-100 gap-1.5"
          >
            <LuX aria-hidden="true" /> Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
