// A stackmat's two touch pads, as a phone's screen plays them.
//
//   idle ──both pads──▶ holding ──(hold time)──▶ ready ──a hand lifts──▶ running ──both pads──▶ stopped ──hands off──▶ idle
//
// Like a stackmat, the timer only arms with both hands down, turns green after
// the hold time, starts the moment a hand leaves a pad, and stops when both
// pads are covered again. A hand that stayed on its pad when the solve started
// doesn't count towards stopping until it's lifted and put back, so lifting one
// hand early can't stop the solve as soon as it starts.
//
// With inspection on, a touch and release in idle starts the 15 seconds (as a
// judge would start the stopwatch); then both hands down and lift as usual.
// With the memo split on (blindfolded events), the first time both pads are
// covered marks the end of memo and the second stops the solve.
//
// Times are the touch events' own timestamps, in whatever clock the caller
// uses (performance.now on the phone), so nothing here reads a clock.

import type { Penalty } from "./solve";

export type PadPhase = "idle" | "inspecting" | "holding" | "ready" | "running" | "stopped";
export type PadSide = "left" | "right";

export interface PadConfig {
  inspection: boolean;
  holdMs: number;
  memoSplit: boolean;
}

export interface PadState {
  phase: PadPhase;
  /** The pads being touched right now. */
  down: Record<PadSide, boolean>;
  /** During a solve: the pads touched since it started (a hand left down from before doesn't count). */
  fresh: Record<PadSide, boolean>;
  inspectionStartedAt: number | null;
  holdStartedAt: number | null;
  startedAt: number | null;
  memoMs: number | null;
  /** After the memo split: both pads must be let go before covering them again stops the solve. */
  awaitingClear: boolean;
}

export interface PadResult {
  timeMs: number;
  penalty: Penalty;
  memoMs: number | null;
  /** In the caller's clock, like the touch times. */
  startedAt: number;
  endedAt: number;
}

export type PadAction =
  | { type: "down"; side: PadSide; time: number }
  | { type: "up"; side: PadSide; time: number }
  /** The hold time may have passed (the caller schedules this for holdStartedAt + holdMs). */
  | { type: "tick"; time: number }
  /** Back to idle without saving anything (inspection or a solve started by accident). */
  | { type: "cancel" };

const INSPECTION_MS = 15_000;
const DNF_AFTER_MS = 17_000;

/** The WCA's inspection penalty for starting after `elapsedMs` of inspection. */
export function inspectionPenalty(elapsedMs: number): Penalty {
  if (elapsedMs > DNF_AFTER_MS) return "dnf";
  if (elapsedMs > INSPECTION_MS) return "+2";
  return "none";
}

const NONE = { left: false, right: false } as const;

export const initialPadState: PadState = {
  phase: "idle",
  down: NONE,
  fresh: NONE,
  inspectionStartedAt: null,
  holdStartedAt: null,
  startedAt: null,
  memoMs: null,
  awaitingClear: false,
};

const both = (pads: Record<PadSide, boolean>) => pads.left && pads.right;
const none = (pads: Record<PadSide, boolean>) => !pads.left && !pads.right;

/** The phase to go back to when a hold is let go too soon. */
const restingPhase = (state: PadState): PadPhase => (state.inspectionStartedAt === null ? "idle" : "inspecting");

/**
 * The next state after a touch, release or tick. `result` is set on the
 * action that stops a solve.
 */
export function padReduce(state: PadState, action: PadAction, config: PadConfig): { state: PadState; result?: PadResult } {
  if (action.type === "cancel") return { state: { ...initialPadState, down: state.down } };

  if (action.type === "tick") {
    if (state.phase === "holding" && state.holdStartedAt !== null && both(state.down) && action.time - state.holdStartedAt >= config.holdMs) {
      return { state: { ...state, phase: "ready" } };
    }
    return { state };
  }

  const isDown = action.type === "down";
  // A second pointer on a pad already held, or a release of a pad not held, changes nothing.
  if (state.down[action.side] === isDown) return { state };
  const down = { ...state.down, [action.side]: isDown };
  const next: PadState = { ...state, down };

  switch (state.phase) {
    case "idle":
      if (config.inspection) {
        // Inspection starts when the hands come off, like a judge starting the stopwatch.
        if (!isDown && none(down)) return { state: { ...next, phase: "inspecting", inspectionStartedAt: action.time } };
        return { state: next };
      }
      if (isDown && both(down)) return { state: { ...next, phase: "holding", holdStartedAt: action.time } };
      return { state: next };

    case "inspecting":
      if (isDown && both(down)) return { state: { ...next, phase: "holding", holdStartedAt: action.time } };
      return { state: next };

    case "holding":
      if (!isDown) return { state: { ...next, phase: restingPhase(state), holdStartedAt: null } };
      return { state: next };

    case "ready":
      if (!isDown) {
        // The first hand off starts the solve.
        return {
          state: { ...next, phase: "running", holdStartedAt: null, startedAt: action.time, memoMs: null, fresh: NONE, awaitingClear: false },
        };
      }
      return { state: next };

    case "running": {
      if (state.startedAt === null) return { state: next };
      if (!isDown) {
        const fresh = { ...state.fresh, [action.side]: false };
        return { state: { ...next, fresh, awaitingClear: state.awaitingClear && !none(down) } };
      }
      const fresh = { ...state.fresh, [action.side]: true };
      if (state.awaitingClear || !both(fresh)) return { state: { ...next, fresh } };
      const elapsed = action.time - state.startedAt;
      if (config.memoSplit && state.memoMs === null) {
        return { state: { ...next, fresh: NONE, memoMs: Math.round(elapsed), awaitingClear: true } };
      }
      const penalty = state.inspectionStartedAt === null ? "none" : inspectionPenalty(state.startedAt - state.inspectionStartedAt);
      return {
        state: { ...next, phase: "stopped", fresh: NONE },
        result: { timeMs: Math.round(elapsed), penalty, memoMs: state.memoMs, startedAt: state.startedAt, endedAt: action.time },
      };
    }

    case "stopped":
      // Hands off the pads: ready for the next solve.
      if (none(down)) return { state: { ...initialPadState } };
      return { state: next };
  }
}
