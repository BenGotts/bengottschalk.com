"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// Import the pure module directly: the wca index also exports server-only API code.
import { fetchLiveResults, type LivePerson, type LiveResult } from "@/lib/wca/live";

const POLL_MS = 30_000;

interface LiveResultsState {
  /** `null` until the first response arrives (or when the person isn't on WCA Live). */
  results: LiveResult[] | null;
  failed: boolean;
}

const LiveResultsContext = createContext<LiveResultsState>({ results: null, failed: false });

export const useLiveResults = () => useContext(LiveResultsContext);

/**
 * Polls WCA Live every 30 seconds while the tab is visible and shares the
 * results with the schedule and the results table, so they make one request.
 */
export default function LiveResultsProvider({ person, children }: { person: LivePerson | null; children: ReactNode }) {
  const [state, setState] = useState<LiveResultsState>({ results: null, failed: false });
  const personId = person?.personId;

  useEffect(() => {
    if (!personId) return undefined;
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      const result = await fetchLiveResults(personId);
      if (cancelled) return;
      // Keep the last good results if a later request fails.
      setState((previous) => (result.ok ? { results: result.data, failed: false } : { ...previous, failed: true }));
    };
    const refresh = () => void load();
    refresh();
    const id = setInterval(refresh, POLL_MS);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [personId]);

  return <LiveResultsContext value={state}>{children}</LiveResultsContext>;
}
