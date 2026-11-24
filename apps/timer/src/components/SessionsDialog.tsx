"use client";

import { useState } from "react";
import { FaCodeBranch, FaCodeMerge, FaTrashCan } from "react-icons/fa6";
import { branchesOf, createBranch, deletingKeepsSolves, discardBranch, mergeBranch, sessionSolves, type TimerSession } from "@bengottschalk/timer-core/sessions";
import { sessionStats } from "@bengottschalk/timer-core/stats";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { uuidv7 } from "@bengottschalk/timer-core/id";
import { removeBranch, saveSession } from "@/lib/db";
import { formatMean } from "@/lib/format";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  main: TimerSession;
  sessions: TimerSession[];
  solves: Solve[];
  currentId: string;
  onSelect: (sessionId: string) => void;
  precision: Precision;
}

/** The time now, for timestamps set from event handlers. */
const now = () => Date.now();

async function rename(session: TimerSession) {
  const next = prompt("Branch name", session.name);
  if (next && next.trim()) await saveSession({ ...session, name: next.trim() });
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

const STATUS_LABEL = { active: "Active", merged: "Merged", discarded: "Discarded" } as const;

export default function SessionsDialog({ open, onClose, main, sessions, solves, currentId, onSelect, precision }: Props) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const event = timerEvent(main.eventId);
  const averageLabel = event.format === "mo3" ? "mo3" : "ao5";

  const summary = (session: TimerSession) => {
    const list = sessionSolves(session, sessions, solves);
    const stats = sessionStats(list.map(solveValue));
    const average = stats.averages.find((a) => a.label === averageLabel);
    return { count: list.length, mean: stats.mean, best: average?.best ?? null, ownCount: solves.filter((s) => s.sessionId === session.id && s.deletedAt === null).length };
  };

  const startBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    const goalNumber = Number.parseInt(goal, 10);
    const branch = createBranch(main, { id: uuidv7(), name: name || (goalNumber ? `ao${goalNumber}` : "Branch"), goal: Number.isFinite(goalNumber) ? goalNumber : null, now: now() });
    await saveSession(branch);
    setName("");
    setGoal("");
    onSelect(branch.id);
    onClose();
  };

  const merge = async (branch: TimerSession) => {
    if (!confirm(`Merge “${branch.name}” into Main? Its solves join Main in the order you did them, and the branch is kept as a read-only record.`)) return;
    await saveSession(mergeBranch(branch, now()));
    if (currentId === branch.id) onSelect(main.id);
  };

  const discard = async (branch: TimerSession) => {
    if (!confirm(`Discard “${branch.name}”? Its solves stay out of Main, but the branch is kept so you can still look at it. (To get rid of it and its solves, use Delete.)`)) return;
    await saveSession(discardBranch(branch, now()));
    if (currentId === branch.id) onSelect(main.id);
  };

  const remove = async (branch: TimerSession) => {
    const own = solves.filter((s) => s.sessionId === branch.id && s.deletedAt === null).length;
    const message = deletingKeepsSolves(branch)
      ? `Delete “${branch.name}”? Its ${plural(own, "solve")} stay in Main; only the branch goes away.`
      : `Delete “${branch.name}” and its ${plural(own, "solve")}? This can't be undone.`;
    if (!confirm(message)) return;
    await removeBranch(branch);
    if (currentId === branch.id) onSelect(main.id);
  };

  const mainSummary = summary(main);
  const branches = branchesOf(main, sessions);

  return (
    <Modal open={open} onClose={onClose} title={`${event.name} sessions`} wide>
      <ul className="space-y-2">
        <li>
          <SessionRow
            title="Main"
            detail={`${mainSummary.count} solves · mean ${formatMean(main.eventId, mainSummary.mean, precision)} · best ${averageLabel} ${formatMean(main.eventId, mainSummary.best, precision)}`}
            current={currentId === main.id}
            onSelect={() => { onSelect(main.id); onClose(); }}
          />
        </li>
        {branches.map((branch) => {
          const s = summary(branch);
          const progress = branch.goal ? ` · ${s.ownCount}/${branch.goal}` : "";
          return (
            <li key={branch.id} className="pl-4">
              <SessionRow
                title={branch.name}
                badge={STATUS_LABEL[branch.status]}
                detail={`${s.count} solves${progress} · mean ${formatMean(main.eventId, s.mean, precision)} · best ${averageLabel} ${formatMean(main.eventId, s.best, precision)}`}
                current={currentId === branch.id}
                onSelect={() => { onSelect(branch.id); onClose(); }}
              >
                {branch.status === "active" && (
                  <>
                    <button type="button" className="btn btn-xs btn-primary" onClick={() => void merge(branch)}><FaCodeMerge aria-hidden /> Merge</button>
                    <button type="button" className="btn btn-xs" onClick={() => void rename(branch)}>Rename</button>
                    <button type="button" className="btn btn-xs btn-ghost" title="Keep the branch as a record, with its solves left out of Main" onClick={() => void discard(branch)}>Discard</button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-error"
                  title={deletingKeepsSolves(branch) ? "Remove the branch; its solves stay in Main" : "Remove the branch and its solves"}
                  onClick={() => void remove(branch)}
                >
                  <FaTrashCan aria-hidden /> Delete
                </button>
              </SessionRow>
            </li>
          );
        })}
      </ul>

      <form className="mt-6 rounded-box bg-base-200 p-3" onSubmit={(e) => void startBranch(e)}>
        <h3 className="mb-2 flex items-center gap-2 font-medium"><FaCodeBranch aria-hidden /> New branch from Main</h3>
        <p className="mb-3 text-sm text-muted">Time a set of solves on their own, like an ao100 attempt. Then merge them into Main, discard the branch (kept as a record, left out of Main), or delete it.</p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grow">
            <span className="mb-1 block text-xs text-muted">Name</span>
            <input className="input input-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="ao100 attempt" />
          </label>
          <label className="w-28">
            <span className="mb-1 block text-xs text-muted">Goal (solves)</span>
            <input className="input input-sm w-full" inputMode="numeric" value={goal} onChange={(e) => setGoal(e.target.value.replaceAll(/\D/g, ""))} placeholder="100" />
          </label>
          <button type="submit" className="btn btn-sm btn-primary">Start branch</button>
        </div>
      </form>
    </Modal>
  );
}

function SessionRow({ title, badge, detail, current, onSelect, children }: { title: string; badge?: string; detail: string; current: boolean; onSelect: () => void; children?: React.ReactNode }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-field border p-2 ${current ? "border-primary" : "border-base-300"}`}>
      <button type="button" className="min-w-0 grow text-left" onClick={onSelect} aria-current={current}>
        <span className="font-medium">{title}</span>
        {badge && <span className="badge badge-sm badge-ghost ml-2">{badge}</span>}
        <span className="block text-xs text-muted">{detail}</span>
      </button>
      {children}
    </div>
  );
}
