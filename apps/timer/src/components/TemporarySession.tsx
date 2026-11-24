"use client";

// Temporary sessions: start one for N solves, then merge it into Main or
// delete it, with a summary if wanted. (Inside timer-core they're branches.)

import { useState } from "react";
import { FaCodeMerge, FaTrashCan } from "react-icons/fa6";
import { createBranch, extendGoal, mergeBranch, sessionSolves, type TimerSession } from "@bengottschalk/timer-core/sessions";
import { solveValue, type Solve } from "@bengottschalk/timer-core/solve";
import { sessionSummary } from "@bengottschalk/timer-core/summary";
import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Precision } from "@bengottschalk/timer-core/time";
import { uuidv7 } from "@bengottschalk/timer-core/id";
import { confirmAction } from "@/lib/confirm";
import { removeBranch, saveSession } from "@/lib/db";
import { formatMean } from "@/lib/format";
import Modal from "./Modal";
import { SessionSummary } from "./SessionSummary";

const QUICK_GOALS = [5, 12, 25, 50, 100] as const;
/** The time now, for timestamps set from event handlers. */
const now = () => Date.now();
const plural = (n: number, word: string) => `${n.toLocaleString()} ${word}${n === 1 ? "" : "s"}`;

/** Picks a solve count (or none) and a name, then starts the session and switches to it. */
export function StartSessionDialog({ open, onClose, main, onStarted }: { open: boolean; onClose: () => void; main: TimerSession; onStarted: (session: TimerSession) => void }) {
  const [goal, setGoal] = useState<number | "none" | "custom">(5);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const count = goal === "custom" ? Number.parseInt(custom, 10) : goal === "none" ? null : goal;
  const valid = count === null || (Number.isFinite(count) && count > 0);

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const session = createBranch(main, { id: uuidv7(), name: name || (count ? `${count} solves` : ""), goal: count, now: now() });
    await saveSession(session);
    setName("");
    onStarted(session);
  };

  return (
    <Modal open={open} onClose={onClose} title={`New temporary session · ${timerEvent(main.eventId).name}`}>
      <form className="space-y-4" onSubmit={(e) => void start(e)}>
        <p className="text-sm text-muted">Time a set of solves on their own, like an ao100 attempt. At the end, merge them into Main or delete them.</p>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">How many solves?</legend>
          <div className="flex flex-wrap gap-2">
            {QUICK_GOALS.map((n) => (
              <button key={n} type="button" className={`btn btn-sm ${goal === n ? "btn-primary" : ""}`} aria-pressed={goal === n} onClick={() => setGoal(n)}>{n}</button>
            ))}
            <button type="button" className={`btn btn-sm ${goal === "custom" ? "btn-primary" : ""}`} aria-pressed={goal === "custom"} onClick={() => setGoal("custom")}>Other</button>
            <button type="button" className={`btn btn-sm ${goal === "none" ? "btn-primary" : ""}`} aria-pressed={goal === "none"} onClick={() => setGoal("none")}>No limit</button>
          </div>
          {goal === "custom" && (
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input className="input input-sm w-24" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replaceAll(/\D/g, ""))} placeholder="30" aria-label="Number of solves" />
              solves
            </label>
          )}
        </fieldset>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Name <span className="font-normal text-muted">(optional)</span></span>
          <input className="input input-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder={count ? `${count} solves` : "Temporary session"} maxLength={100} />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-sm btn-primary" disabled={!valid}>Start</button>
        </div>
      </form>
    </Modal>
  );
}

interface EndProps {
  session: TimerSession | null;
  onClose: () => void;
  main: TimerSession;
  sessions: TimerSession[];
  solves: Solve[];
  precision: Precision;
  /** After merging or deleting: back to Main. */
  onEnded: () => void;
  onOpenSolve: (solve: Solve) => void;
}

/** The end of a temporary session: merge into Main, delete, or keep going, with the summary a click away. */
export function EndSessionDialog({ session, onClose, main, sessions, solves, precision, onEnded, onOpenSolve }: EndProps) {
  const [showSummary, setShowSummary] = useState(false);
  const list = session ? sessionSolves(session, sessions, solves) : [];
  const event = timerEvent(main.eventId);
  const summary = sessionSummary(list.map(solveValue), { fullKind: event.format === "mo3" ? "mean" : "average", minStep: event.kind === "fewest-moves" ? 1 : 10 });
  const reached = session?.goal !== null && session?.goal !== undefined && list.length >= session.goal;

  const close = () => {
    setShowSummary(false);
    onClose();
  };
  const merge = async () => {
    if (!session) return;
    await saveSession(mergeBranch(session, now()));
    setShowSummary(false);
    onEnded();
  };
  const remove = async () => {
    if (!session) return;
    const confirmed = await confirmAction({
      title: `Delete “${session.name}” and its ${plural(list.length, "solve")}?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    await removeBranch(session);
    setShowSummary(false);
    onEnded();
  };
  const extend = async (by: number) => {
    if (!session) return;
    await saveSession(extendGoal(session, by, now()));
    close();
  };

  const title = !session ? "" : reached ? `“${session.name}” is done` : `End “${session.name}”?`;
  return (
    <Modal open={session !== null} onClose={close} title={title} wide>
      {session && (
        <div className="space-y-4">
          <p className="text-sm">
            {plural(list.length, "solve")}{session.goal ? ` of ${session.goal}` : ""}
            {summary.full && <> · {summary.full.label} <span className="timer-digits font-medium">{formatMean(main.eventId, summary.full.value, precision)}</span></>}
            {summary.mean !== null && <> · mean <span className="timer-digits">{formatMean(main.eventId, summary.mean, precision)}</span></>}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => void merge()} disabled={list.length === 0}><FaCodeMerge aria-hidden /> Merge into Main</button>
            <button type="button" className="btn btn-outline btn-error" onClick={() => void remove()}><FaTrashCan aria-hidden /> Delete</button>
          </div>
          <p className="text-xs text-muted">Merging adds these solves to Main in the order you did them and keeps the session as a record. Deleting removes the session and its solves.</p>
          <div className="flex flex-wrap items-center gap-2 border-t border-base-300 pt-3">
            {reached && session.goal ? (
              <>
                <span className="text-sm">Keep going:</span>
                {[5, session.goal].filter((n, i, all) => all.indexOf(n) === i).map((n) => (
                  <button key={n} type="button" className="btn btn-sm" onClick={() => void extend(n)}>+{n} solves</button>
                ))}
                <button type="button" className="btn btn-sm btn-ghost" onClick={close}>Not now</button>
              </>
            ) : (
              <button type="button" className="btn btn-sm" onClick={close}>Keep going</button>
            )}
            <button type="button" className="btn btn-sm btn-ghost ml-auto" aria-expanded={showSummary} onClick={() => setShowSummary(!showSummary)}>
              {showSummary ? "Hide summary" : "Show summary"}
            </button>
          </div>
          {showSummary && <SessionSummary name={session.name} eventId={main.eventId} solves={list} precision={precision} onOpenSolve={onOpenSolve} />}
        </div>
      )}
    </Modal>
  );
}
