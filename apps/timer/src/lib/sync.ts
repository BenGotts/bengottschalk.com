"use client";

// Keeps this device and the signed-in account in step.
//
// Each sync sends the records this device has changed (`pendingSync: 1`) and
// receives everything that changed on the server since the last sync's
// cursor, from any device. Each record keeps whichever copy was edited last
// (see @bengottschalk/timer-core/sync). Syncs run on sign-in, a moment after
// each change, when the tab comes back into focus or the device comes back
// online, and every few minutes. Signed out, nothing is sent anywhere.

import { recordsToApply } from "@bengottschalk/timer-core/sync";
import type { SyncChanges } from "@bengottschalk/timer-core/sync";
import type { TimerSession } from "@bengottschalk/timer-core/sessions";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { SotdMark } from "@bengottschalk/timer-core/sotd";
import type { TimerSyncResponse } from "@/server/sync";
import { clearLocalData, db, getMeta, onLocalChange, remoteWrite, setMeta, withoutSyncFlag, type SyncFlag } from "./db";

export type SyncStatus =
  /** Signed out (or sign-in isn't set up): local only. */
  | "off"
  | "synced"
  | "syncing"
  | "offline"
  | "error"
  /** Waiting for the person to decide what to do with solves made before signing in. */
  | "waiting";

export interface AccountUser {
  id: string;
  name: string;
  image: string | null;
  wcaId: string | null;
}

export interface SyncState {
  user: AccountUser | null;
  status: SyncStatus;
  lastSyncedAt: number | null;
  /** While `waiting`: how many solves on this device aren't in the account. */
  unsyncedSolves: number;
  /** Whether the question about those solves is showing (it can be put off and reopened). */
  askingAboutUnsynced: boolean;
  error: string | null;
  /** While a big download is under way (a new device, say): records received so far, of about how many. */
  progress: { done: number; total: number } | null;
}

const BATCH = 500;
const INTERVAL_MS = 3 * 60_000;
const AFTER_CHANGE_MS = 2_000;
const OWNER_KEY = "sync.userId";
const CURSOR_KEY = "sync.cursor";

let state: SyncState = { user: null, status: "off", lastSyncedAt: null, unsyncedSolves: 0, askingAboutUnsynced: false, error: null, progress: null };

/**
 * The signed-in person's WCA ID: null when signed out (or sign-in isn't set
 * up), or when they haven't competed yet. Listen for changes with
 * `syncStore.subscribe`, or use `useSignedInWcaId` in components.
 */
export const signedInWcaId = (): string | null => state.user?.wcaId ?? null;

/** Shows or puts off the question about solves made before signing in. */
export function askAboutUnsyncedSolves(open: boolean): void {
  setState({ askingAboutUnsynced: open });
}
const listeners = new Set<() => void>();

function setState(changes: Partial<SyncState>) {
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

export const syncStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => state,
};

class SignedOutError extends Error {}

let running: Promise<void> | null = null;
let runAgain = false;
let changeTimer: ReturnType<typeof setTimeout> | null = null;
let intervalTimer: ReturnType<typeof setInterval> | null = null;

/**
 * The sent records (as they are now, `current[i]` for `sent[i]`) that haven't
 * been edited since they were sent, with their sync flag cleared.
 */
function stillAsSent<T extends SyncFlag & { updatedAt: number }>(current: (T | undefined)[], sent: T[]): T[] {
  return current
    .filter((record, i): record is T => record !== undefined && record.pendingSync === 1 && record.updatedAt === sent[i].updatedAt)
    .map((record) => ({ ...record, pendingSync: 0 }));
}

const present = <T>(records: (T | undefined)[]) => records.filter((r): r is T => r !== undefined);

type Changes = SyncChanges<TimerSession, Solve, SotdMark>;
const NO_CHANGES: Changes = { sessions: [], solves: [], sotd: [] };

async function requestSync(cursor: number, changes: Changes): Promise<TimerSyncResponse> {
  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cursor, changes }),
  });
  if (response.status === 401) throw new SignedOutError();
  if (!response.ok) throw new Error(`Sync failed (${response.status}).`);
  // The server's own response type.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return (await response.json()) as TimerSyncResponse;
}

/**
 * Sends local changes and fetches remote ones, repeating until both are
 * caught up. While only downloading, the next page is requested while this
 * one is being saved, so a new device fills up about twice as fast.
 */
async function syncRounds(): Promise<void> {
  let received = 0;
  let prefetched: { cursor: number; response: Promise<TimerSyncResponse> } | null = null;
  try {
    for (;;) {
      const cursor = await getMeta<number>(CURSOR_KEY, 0);
      const [sessions, solves, sotd] = await Promise.all([
        db.sessions.where("pendingSync").equals(1).limit(BATCH).toArray(),
        db.solves.where("pendingSync").equals(1).limit(BATCH).toArray(),
        db.sotd.where("pendingSync").equals(1).limit(BATCH).toArray(),
      ]);
      const sending = sessions.length + solves.length + sotd.length > 0;
      // A prefetched page is only good if nothing needs sending and the cursor is the one it asked from.
      const data: TimerSyncResponse = !sending && prefetched?.cursor === cursor
        ? await prefetched.response
        : await requestSync(cursor, { sessions: sessions.map(withoutSyncFlag), solves: solves.map(withoutSyncFlag), sotd: sotd.map(withoutSyncFlag) });
      prefetched = null;

      const morePending = sessions.length === BATCH || solves.length === BATCH || sotd.length === BATCH;
      if (data.hasMore && !morePending && data.cursor === cursor && !sending) {
        throw new Error("Sync stopped making progress.");
      }
      if (data.hasMore && !morePending) prefetched = { cursor: data.cursor, response: requestSync(data.cursor, NO_CHANGES) };

      await remoteWrite(async () => {
        const remote = data.changes;
        const localSessions = await db.sessions.bulkGet(remote.sessions.map((r) => r.id));
        const localSolves = await db.solves.bulkGet(remote.solves.map((r) => r.id));
        const localMarks = await db.sotd.bulkGet(remote.sotd.map((r) => r.date));
        await db.sessions.bulkPut(recordsToApply(remote.sessions, present(localSessions), (r) => r.id).map((r) => ({ ...r, pendingSync: 0 as const })));
        await db.solves.bulkPut(recordsToApply(remote.solves, present(localSolves), (r) => r.id).map((r) => ({ ...r, pendingSync: 0 as const })));
        await db.sotd.bulkPut(recordsToApply(remote.sotd, present(localMarks), (r) => r.date).map((r) => ({ ...r, pendingSync: 0 as const })));

        // What was sent is on the server now, unless it was edited again meanwhile.
        await db.sessions.bulkPut(stillAsSent(await db.sessions.bulkGet(sessions.map((r) => r.id)), sessions));
        await db.solves.bulkPut(stillAsSent(await db.solves.bulkGet(solves.map((r) => r.id)), solves));
        await db.sotd.bulkPut(stillAsSent(await db.sotd.bulkGet(sotd.map((r) => r.date)), sotd));
        await setMeta(CURSOR_KEY, data.cursor);
      });

      received += data.changes.sessions.length + data.changes.solves.length + data.changes.sotd.length;
      if (data.hasMore) setState({ progress: { done: received, total: received + (data.remaining ?? 0) } });
      if (!data.hasMore && !morePending) return;
    }
  } finally {
    // A request still in flight (after an error) is left to finish on its own.
    prefetched?.response.catch(() => {});
    if (state.progress) setState({ progress: null });
  }
}

/** Syncs now (or right after the sync already running). Does nothing when signed out or waiting. */
export async function syncNow(): Promise<void> {
  if (!state.user || state.status === "waiting") return;
  if (running) {
    runAgain = true;
    return running;
  }
  if (!navigator.onLine) {
    setState({ status: "offline" });
    return;
  }
  running = (async () => {
    setState({ status: "syncing", error: null });
    try {
      do {
        runAgain = false;
        await syncRounds();
      } while (runAgain);
      setState({ status: "synced", lastSyncedAt: Date.now() });
    } catch (error) {
      if (error instanceof SignedOutError) setState({ status: "error", error: "You've been signed out. Sign in again to keep syncing." });
      else setState({ status: navigator.onLine ? "error" : "offline", error: error instanceof Error ? error.message : "Sync failed." });
    } finally {
      running = null;
    }
  })();
  return running;
}

const syncSoon = () => {
  if (changeTimer) clearTimeout(changeTimer);
  changeTimer = setTimeout(() => void syncNow(), AFTER_CHANGE_MS);
};
const onFocus = () => void syncNow();
const onVisible = () => {
  if (document.visibilityState === "visible") void syncNow();
};
const onOffline = () => setState({ status: "offline" });

function startTriggers() {
  onLocalChange(syncSoon);
  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onFocus);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  intervalTimer ??= setInterval(() => void syncNow(), INTERVAL_MS);
}

function stopTriggers() {
  onLocalChange(null);
  window.removeEventListener("focus", onFocus);
  window.removeEventListener("online", onFocus);
  window.removeEventListener("offline", onOffline);
  document.removeEventListener("visibilitychange", onVisible);
  if (intervalTimer) clearInterval(intervalTimer);
  if (changeTimer) clearTimeout(changeTimer);
  intervalTimer = null;
  changeTimer = null;
}

/** How many solves on this device the account doesn't have. */
const countLocalSolves = () => db.solves.filter((s) => s.deletedAt === null).count();

/**
 * Called when a signed-in session is known. If this device holds solves
 * from before signing in (or from another account), waits for the person to
 * choose what to do with them (`resolveUnsyncedSolves`); otherwise syncs.
 */
export async function startSync(user: AccountUser): Promise<void> {
  if (state.user?.id === user.id && state.status !== "off") {
    setState({ user });
    return;
  }
  setState({ user, status: "syncing", error: null });
  const owner = await getMeta<string | null>(OWNER_KEY, null);
  if (owner !== user.id) {
    const count = await countLocalSolves();
    if (count > 0) {
      setState({ status: "waiting", unsyncedSolves: count, askingAboutUnsynced: true });
      return;
    }
    await clearLocalData();
    await setMeta(OWNER_KEY, user.id);
    await setMeta(CURSOR_KEY, 0);
  }
  startTriggers();
  await syncNow();
}

/** The person's choice for solves made before signing in: add them to the account, or remove them from this device. */
export async function resolveUnsyncedSolves(choice: "add" | "remove"): Promise<void> {
  if (!state.user) return;
  if (choice === "remove") {
    await clearLocalData();
  } else {
    // Send everything, including records last synced to another account.
    await db.transaction("rw", [db.solves, db.sessions, db.sotd], async () => {
      await db.solves.toCollection().modify({ pendingSync: 1 });
      await db.sessions.toCollection().modify({ pendingSync: 1 });
      await db.sotd.toCollection().modify({ pendingSync: 1 });
    });
  }
  await setMeta(OWNER_KEY, state.user.id);
  await setMeta(CURSOR_KEY, 0);
  setState({ status: "syncing", unsyncedSolves: 0, askingAboutUnsynced: false });
  startTriggers();
  await syncNow();
}

/** Stops syncing (signed out, or sign-in unavailable). Local data stays as it is. */
export function stopSync(): void {
  stopTriggers();
  setState({ user: null, status: "off", error: null, unsyncedSolves: 0, askingAboutUnsynced: false });
}

/** How many local changes haven't reached the server. */
export async function countPendingChanges(): Promise<number> {
  const counts = await Promise.all([db.solves, db.sessions, db.sotd].map((table) => table.where("pendingSync").equals(1).count()));
  return counts.reduce((a, b) => a + b, 0);
}

/**
 * Before signing out: a last sync, then this device is cleared so the next
 * person (or the same one, signed out) starts from nothing. Returns how many
 * changes would be lost, so the caller can ask first.
 */
export async function prepareSignOut(): Promise<number> {
  if (state.status !== "waiting") await syncNow();
  return countPendingChanges();
}

export async function finishSignOut(): Promise<void> {
  stopSync();
  await clearLocalData();
  await setMeta(OWNER_KEY, null);
  await setMeta(CURSOR_KEY, 0);
}
