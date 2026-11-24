// Everything the timer saves lives in IndexedDB on this device, so it works
// offline and never waits on the network. When signed in, src/lib/sync.ts
// sends local changes to the server and brings back changes from other devices.
//
// Change tracking: any local write to solves, sessions or Solve of the Day
// marks sets `pendingSync: 1` on the record (through Dexie hooks, so every
// writer is covered). Writes that come from the server run in a "remote"
// transaction, which the hooks leave alone.

import { Dexie, type EntityTable, type Transaction } from "dexie";
import type { Solve } from "@bengottschalk/timer-core/solve";
import { createMainSession, mainSessionId, type TimerSession } from "@bengottschalk/timer-core/sessions";
import type { SotdMark } from "@bengottschalk/timer-core/sotd";
import { uuidv7 } from "@bengottschalk/timer-core/id";

interface MetaEntry {
  key: string;
  value: unknown;
}

/** 1 while a record has local changes the server hasn't had yet (a number, so it can be indexed). */
export interface SyncFlag {
  pendingSync?: 0 | 1;
}

class TimerDatabase extends Dexie {
  solves!: EntityTable<Solve & SyncFlag, "id">;
  sessions!: EntityTable<TimerSession & SyncFlag, "id">;
  sotd!: EntityTable<SotdMark & SyncFlag, "date">;
  meta!: EntityTable<MetaEntry, "key">;

  constructor() {
    super("cube-timer");
    this.version(1).stores({
      solves: "id, sessionId, eventId, startedAt, updatedAt",
      sessions: "id, eventId, parentId, updatedAt",
      sotd: "date, solveId, updatedAt",
      meta: "key",
    });
    // Version 2: change tracking for sync. Everything saved before it is unsent.
    this.version(2)
      .stores({
        solves: "id, sessionId, eventId, startedAt, updatedAt, pendingSync",
        sessions: "id, eventId, parentId, updatedAt, pendingSync",
        sotd: "date, solveId, updatedAt, pendingSync",
      })
      .upgrade(async (tx) => {
        for (const table of ["solves", "sessions", "sotd"]) await tx.table(table).toCollection().modify({ pendingSync: 1 });
      });
  }
}

export const db = new TimerDatabase();

const remoteTransactions = new WeakSet<IDBTransaction>();
const isRemote = (tx: Transaction) => remoteTransactions.has(tx.idbtrans);

let localChangeListener: (() => void) | null = null;

/** Called (after the write) whenever this device changes a synced record. */
export function onLocalChange(listener: (() => void) | null): void {
  localChangeListener = listener;
}

const notifyLocalChange = () => {
  if (localChangeListener) setTimeout(localChangeListener, 0);
};

for (const table of [db.solves, db.sessions, db.sotd]) {
  table.hook("creating", (_key, record, tx) => {
    if (isRemote(tx)) return;
    record.pendingSync = 1;
    notifyLocalChange();
  });
  table.hook("updating", (modifications, _key, _record, tx) => {
    if (isRemote(tx) || "pendingSync" in modifications) return undefined;
    notifyLocalChange();
    return { pendingSync: 1 };
  });
}

/**
 * Runs `fn` in a transaction whose writes count as coming from the server:
 * they don't mark records as needing to sync.
 */
export function remoteWrite<T>(fn: () => Promise<T>): Promise<T> {
  return db.transaction("rw", [db.solves, db.sessions, db.sotd, db.meta], (tx) => {
    remoteTransactions.add(tx.idbtrans);
    return fn();
  });
}

/** Removes every solve, session and Solve of the Day mark from this device (after signing out, say). */
export async function clearLocalData(): Promise<void> {
  await remoteWrite(async () => {
    await Promise.all([db.solves.clear(), db.sessions.clear(), db.sotd.clear()]);
  });
}

/** Drops the sync flag before a record leaves the device. */
export function withoutSyncFlag<T extends SyncFlag>({ pendingSync: _pending, ...record }: T): Omit<T, "pendingSync"> {
  return record;
}

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const entry = await db.meta.get(key);
  // Each key is only ever written with one type, by setMeta's callers.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return entry === undefined ? fallback : (entry.value as T);
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value });
}

/** The event's main session, made the first time the event is opened. */
export async function ensureMainSession(eventId: string): Promise<TimerSession> {
  const id = mainSessionId(eventId);
  const existing = await db.sessions.get(id);
  if (existing) return existing;
  const session = createMainSession(eventId, Date.now());
  await db.sessions.put(session);
  return session;
}

export type NewSolve = Omit<Solve, "id" | "createdAt" | "updatedAt" | "deletedAt" | "comment" | "source" | "competition"> & { comment?: string };

export async function addSolve(input: NewSolve): Promise<Solve> {
  const now = Date.now();
  const solve: Solve = { comment: "", source: "home", competition: null, ...input, id: uuidv7(now), createdAt: now, updatedAt: now, deletedAt: null };
  await db.solves.add(solve);
  return solve;
}

export async function updateSolve(id: string, changes: Partial<Omit<Solve, "id">>): Promise<void> {
  await db.solves.update(id, { ...changes, updatedAt: Date.now() });
}

/** Marks a solve deleted (kept so the deletion syncs) and clears its Solve of the Day mark. */
export async function deleteSolve(id: string): Promise<void> {
  const now = Date.now();
  await db.transaction("rw", db.solves, db.sotd, async () => {
    await db.solves.update(id, { deletedAt: now, updatedAt: now });
    const marks = await db.sotd.where("solveId").equals(id).toArray();
    for (const mark of marks) await db.sotd.update(mark.date, { deletedAt: now, updatedAt: now });
  });
}

export async function restoreSolve(id: string): Promise<void> {
  await db.solves.update(id, { deletedAt: null, updatedAt: Date.now() });
}

export async function saveSession(session: TimerSession): Promise<void> {
  await db.sessions.put({ ...session, updatedAt: Date.now() });
}

export async function setSotd(date: string, solveId: string | null): Promise<void> {
  const now = Date.now();
  if (solveId === null) {
    await db.sotd.update(date, { deletedAt: now, updatedAt: now });
    return;
  }
  await db.sotd.put({ date, solveId, updatedAt: now, deletedAt: null });
}

/** Everything on this device as one JSON backup. */
export async function exportBackup(): Promise<string> {
  const [solves, sessions, sotd] = await Promise.all([db.solves.toArray(), db.sessions.toArray(), db.sotd.toArray()]);
  return JSON.stringify({
    app: "cube-timer",
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions: sessions.map(withoutSyncFlag),
    solves: solves.map(withoutSyncFlag),
    sotd: sotd.map(withoutSyncFlag),
  });
}

/** Whether a record from a backup is newer than the one already here. */
const newer = <T extends { updatedAt: number }>(incoming: T, existing: T | undefined) => !existing || incoming.updatedAt > existing.updatedAt;

/** Restores a backup made by `exportBackup`, keeping whichever copy of each record was edited last. */
export async function importBackup(text: string): Promise<{ solves: number; sessions: number }> {
  // A file this app wrote (checked by `app` below); its records are trusted as written.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const data = JSON.parse(text) as { app?: string; solves?: Solve[]; sessions?: TimerSession[]; sotd?: SotdMark[] };
  if (data.app !== "cube-timer" || !Array.isArray(data.solves) || !Array.isArray(data.sessions)) {
    throw new Error("That file isn't a Cube Timer backup.");
  }
  let solves = 0;
  let sessions = 0;
  await db.transaction("rw", db.solves, db.sessions, db.sotd, async () => {
    for (const session of data.sessions!) {
      if (newer(session, await db.sessions.get(session.id))) {
        await db.sessions.put(session);
        sessions++;
      }
    }
    for (const solve of data.solves!) {
      if (newer(solve, await db.solves.get(solve.id))) {
        await db.solves.put(solve);
        solves++;
      }
    }
    for (const mark of data.sotd ?? []) {
      if (newer(mark, await db.sotd.get(mark.date))) await db.sotd.put(mark);
    }
  });
  return { solves, sessions };
}
