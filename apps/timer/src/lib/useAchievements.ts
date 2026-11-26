"use client";

// Achievements for every solve on this device (all events), and which ones
// this device hasn't announced yet.

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ACHIEVEMENTS_BY_ID, earnedIds, evaluateAchievements, type Achievement, type AchievementReport } from "@bengottschalk/timer-core/achievements";
import { db, getMeta, setMeta } from "./db";

const SEEN_KEY = "achievementsSeen";

export interface Achievements {
  /** Null while solves load. */
  report: AchievementReport | null;
  earned: ReadonlySet<string>;
  /** Earned since this device last announced them, oldest first. */
  fresh: Achievement[];
  /** How many were already earned from past solves when achievements first came to this device (shown once). */
  backfilled: number;
  /** Marks everything earned so far as announced. */
  markSeen: () => void;
}

const NONE = new Set<string>();

export function useAchievements({ sotdEnabled }: { sotdEnabled: boolean }): Achievements {
  const solves = useLiveQuery(() => db.solves.toArray(), []);
  const marks = useLiveQuery(() => db.sotdMarks.toArray(), []);
  // Worked out after the timer has updated, so a new solve never waits on it.
  const deferredSolves = useDeferredValue(solves);
  const deferredMarks = useDeferredValue(marks);

  const report = useMemo(
    () => (deferredSolves && deferredMarks ? evaluateAchievements({ solves: deferredSolves, marks: sotdEnabled ? deferredMarks : [] }) : null),
    [deferredSolves, deferredMarks, sotdEnabled],
  );
  const earned = useMemo(() => (report ? earnedIds(report) : NONE), [report]);

  // Null until read.
  const [seen, setSeen] = useState<Set<string> | null>(null);
  const [backfilled, setBackfilled] = useState(0);
  useEffect(() => {
    void (async () => {
      const saved = await getMeta<string[] | null>(SEEN_KEY, null);
      if (saved) {
        setSeen(new Set(saved));
        return;
      }
      // The first time on this device: what past solves already earned counts as announced, with one note about it.
      // (Solve of the Day marks count whether or not it's shown, so signing in later doesn't announce them.)
      const [allSolves, allMarks] = await Promise.all([db.solves.toArray(), db.sotdMarks.toArray()]);
      const already = earnedIds(evaluateAchievements({ solves: allSolves, marks: allMarks }));
      await setMeta(SEEN_KEY, [...already]);
      setBackfilled(already.size);
      setSeen(already);
    })();
  }, []);

  const save = useCallback((ids: ReadonlySet<string>) => {
    setSeen(new Set(ids));
    void setMeta(SEEN_KEY, [...ids]);
  }, []);

  const fresh = useMemo(() => {
    if (!seen || !report) return [];
    return [...earned]
      .filter((id) => !seen.has(id))
      .map((id) => ({ achievement: ACHIEVEMENTS_BY_ID.get(id)!, at: report.statuses.get(id)!.earnedAt! }))
      .toSorted((a, b) => a.at - b.at)
      .map(({ achievement }) => achievement);
  }, [seen, report, earned]);

  const markSeen = useCallback(() => {
    setBackfilled(0);
    // Keep ids seen before, so one taken back (a deleted solve) and earned again isn't announced twice.
    save(new Set([...(seen ?? []), ...earned]));
  }, [seen, earned, save]);

  return { report, earned, fresh, backfilled, markSeen };
}
