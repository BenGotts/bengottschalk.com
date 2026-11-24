"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { signedInWcaId, syncStore } from "@/lib/sync";
import { getMeta, setMeta } from "@/lib/db";
import { competitionsToday, refreshDue, refreshLiveResults, refreshOfficialResults, lastRefreshedAt, type RefreshProgress } from "./results";

const LIVE_POLL_MS = 60_000;

/**
 * Runs `task` in only one tab at a time: if another tab of the timer is
 * already doing it, this one skips it (that tab's results reach this one
 * through the shared IndexedDB).
 */
async function inOneTab(name: string, task: () => Promise<void>): Promise<void> {
  if (!("locks" in navigator)) return task();
  await navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
    if (lock) await task();
  });
}

export interface CompetitionResultsState {
  wcaId: string | null;
  loading: boolean;
  progress: RefreshProgress | null;
  error: string | null;
  refreshedAt: number;
  /** Competitions on today whose WCA Live results are being followed. */
  liveCompetitionIds: string[];
  refresh: () => void;
}

/**
 * Keeps competition attempts up to date for the signed-in WCA ID: official
 * results when due (see results.ts) or on request, and WCA Live every minute
 * while one of the person's competitions is on and the page is open.
 */
export function useCompetitionResults(): CompetitionResultsState {
  // Only people signed in with WCA get their results, under their own WCA ID.
  const wcaId = useSyncExternalStore(syncStore.subscribe, signedInWcaId, () => null);
  const refreshedAt = useLiveQuery(() => (wcaId ? lastRefreshedAt(wcaId) : 0), [wcaId]) ?? 0;
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<RefreshProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveCompetitionIds, setLiveCompetitionIds] = useState<string[]>([]);
  const running = useRef(false);

  const run = useCallback(async (id: string, force: boolean) => {
    if (running.current) return;
    running.current = true;
    try {
      await inOneTab("wca-official-results", async () => {
        if (force || (await refreshDue(id))) {
          setLoading(true);
          await refreshOfficialResults(id, setProgress);
        }
      });
      setLiveCompetitionIds(await competitionsToday(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load WCA results.");
    } finally {
      running.current = false;
      setLoading(false);
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    if (!wcaId) return;
    void (async () => {
      await run(wcaId, false);
    })();
  }, [wcaId, run]);

  // Follow WCA Live while a competition is on and the page is visible.
  useEffect(() => {
    if (!wcaId || liveCompetitionIds.length === 0) return undefined;
    const poll = () => {
      if (document.visibilityState !== "visible") return;
      // However many tabs are open, WCA Live is asked at most once a minute.
      void inOneTab("wca-live", async () => {
        const polledAt = await getMeta<number>("wca:live-polled-at", 0);
        if (Date.now() - polledAt < LIVE_POLL_MS - 5_000) return;
        await setMeta("wca:live-polled-at", Date.now());
        for (const competitionId of liveCompetitionIds) {
          await refreshLiveResults(competitionId, wcaId).catch(() => {
            // WCA Live may be briefly unreachable; the next poll tries again.
          });
        }
      });
    };
    poll();
    const timer = setInterval(poll, LIVE_POLL_MS);
    document.addEventListener("visibilitychange", poll);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [wcaId, liveCompetitionIds]);

  const refresh = useCallback(() => {
    if (wcaId) void run(wcaId, true);
  }, [wcaId, run]);

  return { wcaId, loading, progress, error, refreshedAt, liveCompetitionIds, refresh };
}
