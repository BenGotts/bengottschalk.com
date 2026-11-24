// Sync between devices and the server, record by record: the copy edited
// last wins. Every record (solve, session, Solve of the Day mark) carries an
// `updatedAt` set when it was last edited, and deletions are kept as marked
// records, so they win (or lose) the same way.

export interface Versioned {
  updatedAt: number;
}

/**
 * On the server: whether a record a device sent replaces the stored copy.
 * Only a strictly newer edit does, so resending the same record changes nothing.
 */
export function incomingWins(incoming: Versioned, stored: Versioned | undefined): boolean {
  return stored === undefined || incoming.updatedAt > stored.updatedAt;
}

/**
 * On a device: whether a record from the server replaces the local copy.
 * The server's copy also wins a tie, so every device ends up with the same record.
 */
export function remoteWins(remote: Versioned, local: Versioned | undefined): boolean {
  return local === undefined || remote.updatedAt >= local.updatedAt;
}

/** The records in `remote` that should replace (or add to) `local`, matched by `key`. */
export function recordsToApply<T extends Versioned>(remote: readonly T[], local: readonly T[], key: (record: T) => string): T[] {
  const byKey = new Map(local.map((record) => [key(record), record]));
  return remote.filter((record) => remoteWins(record, byKey.get(key(record))));
}

export interface SyncChanges<Session, Solve, Mark> {
  sessions: Session[];
  solves: Solve[];
  sotd: Mark[];
}

export interface SyncRequest<Session, Solve, Mark> {
  /** The server cursor from the last sync, or 0 the first time. */
  cursor: number;
  changes: SyncChanges<Session, Solve, Mark>;
}

export interface SyncResponse<Session, Solve, Mark> {
  /** Pass back next time; everything up to it has been sent. */
  cursor: number;
  changes: SyncChanges<Session, Solve, Mark>;
  /** More changes are waiting: sync again straight away. */
  hasMore: boolean;
  /** When `hasMore`: about how many records are still to come (for showing progress). */
  remaining?: number;
}
