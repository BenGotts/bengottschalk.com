import { describe, expect, it } from "vitest";
import { acceptsSolves, branchesOf, createBranch, createMainSession, deleteBranch, deletingKeepsSolves, discardBranch, mergeBranch, sessionSolves } from "./sessions";
import { sessionStats } from "./stats";
import type { Solve } from "./solve";

const solve = (id: string, sessionId: string, startedAt: number): Solve => ({
  id, eventId: "333", sessionId, timeMs: 10000, penalty: "none", scramble: "", comment: "",
  startedAt, endedAt: null, source: "home", competition: null, memoMs: null, fmc: null, multi: null, entry: "timer",
  createdAt: startedAt, updatedAt: startedAt, deletedAt: null,
});

describe("branches", () => {
  const main = createMainSession("333", 0);
  const branch = createBranch(main, { id: "b1", name: "ao100 attempt", goal: 100, now: 1 });
  const solves = [solve("m1", main.id, 1), solve("b1-1", "b1", 2), solve("m2", main.id, 3), solve("b1-2", "b1", 4)];

  it("keeps branch solves out of main until merged", () => {
    expect(sessionSolves(main, [main, branch], solves).map((s) => s.id)).toEqual(["m1", "m2"]);
    expect(sessionSolves(branch, [main, branch], solves).map((s) => s.id)).toEqual(["b1-1", "b1-2"]);
  });

  it("merges branch solves into main in the order they were done", () => {
    const merged = mergeBranch(branch, 5);
    expect(merged.status).toBe("merged");
    expect(sessionSolves(main, [main, merged], solves).map((s) => s.id)).toEqual(["m1", "b1-1", "m2", "b1-2"]);
    expect(sessionSolves(merged, [main, merged], solves).map((s) => s.id)).toEqual(["b1-1", "b1-2"]);
  });

  it("leaves discarded branches out of main", () => {
    const discarded = discardBranch(branch, 5);
    expect(sessionSolves(main, [main, discarded], solves).map((s) => s.id)).toEqual(["m1", "m2"]);
  });

  it("refuses branches of branches and merging twice", () => {
    expect(() => createBranch(branch, { id: "b2", name: "x", goal: null, now: 2 })).toThrow();
    expect(() => mergeBranch(mergeBranch(branch, 5), 6)).toThrow();
    expect(() => mergeBranch(main, 5)).toThrow();
  });

  it("hides deleted solves", () => {
    const withDeleted = [...solves, { ...solve("m3", main.id, 6), deletedAt: 7 }];
    expect(sessionSolves(main, [main, branch], withDeleted).map((s) => s.id)).toEqual(["m1", "m2"]);
  });
});

describe("deleting branches", () => {
  const main = createMainSession("333", 0);
  const branch = createBranch(main, { id: "b1", name: "ao5", goal: 5, now: 1 });
  const solves = [solve("m1", main.id, 1), solve("b1-1", "b1", 2), solve("b1-2", "b1", 3), solve("m2", main.id, 4)];
  const values = (list: Solve[]) => list.map((s) => s.timeMs);

  it("marks the branch deleted, so the deletion syncs, and hides it from the list", () => {
    const deleted = deleteBranch(branch, 9);
    expect(deleted).toMatchObject({ deletedAt: 9, updatedAt: 9, status: "active" });
    expect(branchesOf(main, [main, deleted])).toEqual([]);
    expect(acceptsSolves(deleted)).toBe(false);
  });

  it("never deletes Main", () => {
    expect(() => deleteBranch(main, 9)).toThrow();
  });

  it("keeps a merged branch's solves in Main (and its stats) after the branch is deleted", () => {
    const deleted = deleteBranch(mergeBranch(branch, 5), 9);
    expect(deletingKeepsSolves(mergeBranch(branch, 5))).toBe(true);
    const inMain = sessionSolves(main, [main, deleted], solves);
    expect(inMain.map((s) => s.id)).toEqual(["m1", "b1-1", "b1-2", "m2"]);
    expect(sessionStats(values(inMain)).count).toBe(4);
    expect(branchesOf(main, [main, deleted])).toEqual([]);
  });

  it("deletes the solves of an active or discarded branch with it", () => {
    expect(deletingKeepsSolves(branch)).toBe(false);
    expect(deletingKeepsSolves(discardBranch(branch, 5))).toBe(false);
    // The app soft-deletes those solves; Main never showed them and still doesn't.
    const afterDelete = solves.map((s) => (s.sessionId === "b1" ? { ...s, deletedAt: 9 } : s));
    const deleted = deleteBranch(branch, 9);
    expect(sessionSolves(main, [main, deleted], afterDelete).map((s) => s.id)).toEqual(["m1", "m2"]);
    expect(sessionSolves(deleted, [main, deleted], afterDelete)).toEqual([]);
  });
});
