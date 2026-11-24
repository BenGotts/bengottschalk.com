"use client";

// Asks the person to confirm something (deleting a solve, say) in the
// timer's own dialog instead of the browser's plain pop-up:
//
//   if (!(await confirmAction({ title: "Delete this solve?", confirmLabel: "Delete", danger: true }))) return;
//
// <ConfirmDialog /> (mounted once by TimerApp) shows whichever request is open.

import { timerEvent } from "@bengottschalk/timer-core/events";
import type { Solve } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatSolve } from "./format";

export interface ConfirmRequest {
  title: string;
  /** More detail under the title, like which solve it is. */
  message?: string;
  confirmLabel: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
}

interface Pending extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

let pending: Pending | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** Resolves true if the person confirms, false if they cancel (or close the dialog). */
export function confirmAction(request: ConfirmRequest): Promise<boolean> {
  // A new request replaces one still open, which counts as cancelled.
  pending?.resolve(false);
  return new Promise((resolve) => {
    pending = { ...request, resolve };
    notify();
  });
}

/** Answers the open request. */
export function answerConfirm(confirmed: boolean): void {
  const current = pending;
  pending = null;
  notify();
  current?.resolve(confirmed);
}

export const confirmStore = {
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: (): ConfirmRequest | null => pending,
};

/** Asks before deleting a solve, naming it ("Delete 8.12? 3x3x3 Cube, 24 Nov, 10:31"). */
export function confirmSolveDeletion(solve: Solve, precision: Precision): Promise<boolean> {
  const when = new Date(solve.startedAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  return confirmAction({
    title: `Delete ${formatSolve(solve, precision)}?`,
    message: `${timerEvent(solve.eventId).name}, ${when}.${solve.comment ? ` “${solve.comment}”` : ""}`,
    confirmLabel: "Delete",
    danger: true,
  });
}
