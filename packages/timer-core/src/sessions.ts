// Sessions: one main session per event, plus branches started from it.
//
// A solve keeps the session it was done in forever. Merging a branch just
// marks it merged, and a main session's view includes the solves of its
// merged branches, in the order they were done. So a merged branch stays a
// record of its own (its solves and stats), and nothing is rewritten.
//
// Deleting a branch marks it deleted (so the deletion syncs). What happens to
// its solves depends on whether they already count in Main:
// - an active or discarded branch's solves are deleted with it;
// - a merged branch's solves stay in Main. Main keeps including the solves
//   of every merged branch, deleted or not, so deleting one hides only the
//   branch itself: no solve has to move, and the one changed record syncs.

import type { Solve } from "./solve";

export type SessionStatus = "active" | "merged" | "discarded";

export interface TimerSession {
  id: string;
  eventId: string;
  /** The main session a branch was started from; null for a main session. */
  parentId: string | null;
  name: string;
  /** How many solves the branch is aiming for, like 100 for an ao100 attempt. */
  goal: number | null;
  status: SessionStatus;
  createdAt: number;
  updatedAt: number;
  mergedAt: number | null;
  deletedAt: number | null;
}

/**
 * Main sessions have a fixed id per event, so two devices that each start
 * timing 3×3 before syncing end up with the same main session.
 */
export const mainSessionId = (eventId: string): string => `main-${eventId}`;

export const isMainSession = (session: Pick<TimerSession, "parentId">): boolean => session.parentId === null;

export function createMainSession(eventId: string, now: number): TimerSession {
  return {
    id: mainSessionId(eventId),
    eventId,
    parentId: null,
    name: "Main",
    goal: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
    mergedAt: null,
    deletedAt: null,
  };
}

export function createBranch(parent: TimerSession, options: { id: string; name: string; goal: number | null; now: number }): TimerSession {
  if (!isMainSession(parent)) throw new Error("Branches can only start from a main session.");
  return {
    id: options.id,
    eventId: parent.eventId,
    parentId: parent.id,
    name: options.name.trim() || "Branch",
    goal: options.goal !== null && options.goal > 0 ? Math.floor(options.goal) : null,
    status: "active",
    createdAt: options.now,
    updatedAt: options.now,
    mergedAt: null,
    deletedAt: null,
  };
}

export function mergeBranch(branch: TimerSession, now: number): TimerSession {
  if (isMainSession(branch)) throw new Error("A main session can't be merged.");
  if (branch.status !== "active") throw new Error("Only an active branch can be merged.");
  return { ...branch, status: "merged", mergedAt: now, updatedAt: now };
}

export function discardBranch(branch: TimerSession, now: number): TimerSession {
  if (isMainSession(branch)) throw new Error("A main session can't be discarded.");
  if (branch.status !== "active") throw new Error("Only an active branch can be discarded.");
  return { ...branch, status: "discarded", updatedAt: now };
}

export function deleteBranch(branch: TimerSession, now: number): TimerSession {
  if (isMainSession(branch)) throw new Error("A main session can't be deleted.");
  return { ...branch, deletedAt: now, updatedAt: now };
}

/** Whether deleting this branch keeps its solves (they're already part of Main) or deletes them too. */
export const deletingKeepsSolves = (branch: TimerSession): boolean => branch.status === "merged";

/** Whether new solves can be added to a session (merged and discarded branches are read-only). */
export const acceptsSolves = (session: TimerSession): boolean => session.status === "active" && session.deletedAt === null;

/** Solves in the order they were done; ties keep the order they were made in. */
export function bySolveOrder(a: Solve, b: Solve): number {
  return a.startedAt - b.startedAt || a.createdAt - b.createdAt || a.id.localeCompare(b.id);
}

/**
 * The solves a session shows, oldest first. A main session shows its own
 * solves and those of its merged branches (including deleted ones: see the
 * top of this file); a branch shows only its own.
 */
export function sessionSolves(session: TimerSession, sessions: readonly TimerSession[], solves: readonly Solve[]): Solve[] {
  const included = new Set([session.id]);
  if (isMainSession(session)) {
    for (const other of sessions) {
      if (other.parentId === session.id && other.status === "merged") included.add(other.id);
    }
  }
  return solves.filter((solve) => solve.deletedAt === null && included.has(solve.sessionId)).toSorted(bySolveOrder);
}

/** A main session's branches: active first (newest first), then merged, then discarded. */
export function branchesOf(main: TimerSession, sessions: readonly TimerSession[]): TimerSession[] {
  const rank = { active: 0, merged: 1, discarded: 2 } satisfies Record<SessionStatus, number>;
  return sessions
    .filter((session) => session.parentId === main.id && session.deletedAt === null)
    .toSorted((a, b) => rank[a.status] - rank[b.status] || b.createdAt - a.createdAt);
}
