"use client";

import { useState } from "react";
import { FaChartSimple, FaCodeMerge, FaPlus, FaTrashCan } from "react-icons/fa6";
import { branchesOf, deletingKeepsSolves, discardBranch, mergeBranch, sessionSolves, type TimerSession } from "@bengottschalk/timer-core/sessions";
import { sessionStats } from "@bengottschalk/timer-core/stats";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { timerEvent } from "@bengottschalk/timer-core/events";
import { confirmAction } from "@/lib/confirm";
import { removeBranch, saveSession } from "@/lib/db";
import { multiBlindStats } from "@bengottschalk/timer-core/multi";
import { formatMean, formatSolveWithPoints } from "@/lib/format";
import Modal from "./Modal";
import { SessionSummaryDialog } from "./SessionSummary";

interface Props {
  open: boolean;
  onClose: () => void;
  main: TimerSession;
  sessions: TimerSession[];
  solves: Solve[];
  currentId: string;
  onSelect: (sessionId: string) => void;
  precision: Precision;
  /** Opens the dialog that starts a temporary session. */
  onStartTemporary: () => void;
  onOpenSolve: (solve: Solve) => void;
}

/** The time now, for timestamps set from event handlers. */
const now = () => Date.now();

async function rename(session: TimerSession) {
  const next = prompt("Session name", session.name);
  if (next && next.trim()) await saveSession({ ...session, name: next.trim() });
}

const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

const STATUS_LABEL = { active: "Active", merged: "Merged", discarded: "Discarded" } as const;

export default function SessionsDialog({ open, onClose, main, sessions, solves, currentId, onSelect, precision, onStartTemporary, onOpenSolve }: Props) {
  const [summaryOf, setSummaryOf] = useState<TimerSession | null>(null);
  const event = timerEvent(main.eventId);
  const averageLabel = event.format === "mo3" ? "mo3" : "ao5";

  const summary = (session: TimerSession) => {
    const list = sessionSolves(session, sessions, solves);
    const ownCount = solves.filter((s) => s.sessionId === session.id && s.deletedAt === null).length;
    // Multi-Blind has no averages: its best result by points instead.
    if (event.format === "best") {
      const { bestIndex } = multiBlindStats(list);
      const best = bestIndex === null ? "–" : formatSolveWithPoints(list[bestIndex], precision);
      return { count: list.length, ownCount, text: (extra: string) => `${list.length} ${list.length === 1 ? "attempt" : "attempts"}${extra} · best ${best}` };
    }
    const stats = sessionStats(list.map(solveValue));
    const average = stats.averages.find((a) => a.label === averageLabel);
    const text = (extra: string) => `${list.length} solves${extra} · mean ${formatMean(event.id, stats.mean, precision)} · best ${averageLabel} ${formatMean(event.id, average?.best ?? null, precision)}`;
    return { count: list.length, ownCount, text };
  };

  const ownSolves = (branch: TimerSession) => solves.filter((s) => s.sessionId === branch.id && s.deletedAt === null).length;

  const merge = async (branch: TimerSession) => {
    const confirmed = await confirmAction({
      title: `Merge “${branch.name}” into Main?`,
      message: `Its ${plural(ownSolves(branch), "solve")} join Main in the order you did them, and the session is kept as a read-only record.`,
      confirmLabel: "Merge",
    });
    if (!confirmed) return;
    await saveSession(mergeBranch(branch, now()));
    if (currentId === branch.id) onSelect(main.id);
  };

  const discard = async (branch: TimerSession) => {
    const confirmed = await confirmAction({
      title: `Discard “${branch.name}”?`,
      message: `Its ${plural(ownSolves(branch), "solve")} stay out of Main, but the session is kept so you can still look at it. To get rid of it and its solves, use Delete.`,
      confirmLabel: "Discard",
    });
    if (!confirmed) return;
    await saveSession(discardBranch(branch, now()));
    if (currentId === branch.id) onSelect(main.id);
  };

  const remove = async (branch: TimerSession) => {
    const own = ownSolves(branch);
    const keeps = deletingKeepsSolves(branch);
    const confirmed = await confirmAction({
      title: keeps ? `Delete “${branch.name}”?` : `Delete “${branch.name}” and its ${plural(own, "solve")}?`,
      message: keeps ? `Its ${plural(own, "solve")} stay in Main; only the session goes away.` : "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
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
            detail={mainSummary.text("")}
            current={currentId === main.id}
            onSelect={() => { onSelect(main.id); onClose(); }}
          >
            <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSummaryOf(main)}><FaChartSimple aria-hidden /> Summary</button>
          </SessionRow>
        </li>
        {branches.map((branch) => {
          const s = summary(branch);
          const progress = branch.goal ? ` · ${s.ownCount}/${branch.goal}` : "";
          return (
            <li key={branch.id} className="pl-4">
              <SessionRow
                title={branch.name}
                badge={STATUS_LABEL[branch.status]}
                detail={s.text(progress)}
                current={currentId === branch.id}
                onSelect={() => { onSelect(branch.id); onClose(); }}
              >
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => setSummaryOf(branch)}><FaChartSimple aria-hidden /> Summary</button>
                {branch.status === "active" && (
                  <>
                    <button type="button" className="btn btn-xs btn-primary" onClick={() => void merge(branch)}><FaCodeMerge aria-hidden /> Merge</button>
                    <button type="button" className="btn btn-xs" onClick={() => void rename(branch)}>Rename</button>
                    <button type="button" className="btn btn-xs btn-ghost" title="Keep the session as a record, with its solves left out of Main" onClick={() => void discard(branch)}>Discard</button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-error"
                  title={deletingKeepsSolves(branch) ? "Remove the session; its solves stay in Main" : "Remove the session and its solves"}
                  onClick={() => void remove(branch)}
                >
                  <FaTrashCan aria-hidden /> Delete
                </button>
              </SessionRow>
            </li>
          );
        })}
      </ul>

      {branches.length === 0 && (
        <p className="mt-3 text-sm text-muted">No temporary sessions yet.</p>
      )}
      <div className="mt-6 rounded-box bg-base-200 p-3">
        <p className="mb-3 text-sm text-muted">A temporary session times a set of solves on their own, like an ao100 attempt. At the end, merge them into Main or delete them, and look at a summary if you like.</p>
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { onClose(); onStartTemporary(); }}>
          <FaPlus aria-hidden /> New temporary session
        </button>
      </div>

      {summaryOf && (
        <SessionSummaryDialog
          open
          onClose={() => setSummaryOf(null)}
          name={summaryOf.name}
          eventId={main.eventId}
          solves={sessionSolves(summaryOf, sessions, solves)}
          precision={precision}
          onOpenSolve={onOpenSolve}
        />
      )}
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
