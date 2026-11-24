"use client";

// The timer's state machine, driven by the space bar or a touch on the timer.
//
//   idle ──press──▶ holding ──(hold time)──▶ ready ──release──▶ running ──any key──▶ stopped ──release──▶ idle
//
// With inspection on, pressing and releasing in idle starts inspection first;
// then hold and release as usual. Times come from the input events'
// timestamps (performance.now's clock), not from screen frames.
//
// Like csTimer, a mouse click never starts anything (only the space bar, or a
// touch or pen on the timer); any key, click or touch stops a running solve.
// The space bar always belongs to the timer, even when a button or the event
// menu has focus, unless the person is typing in a text field.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Penalty } from "@bengottschalk/timer-core/solve";

export type TimerPhase = "idle" | "inspecting" | "holding" | "ready" | "running" | "stopped";

export interface FinishedSolve {
  timeMs: number;
  penalty: Penalty;
  memoMs: number | null;
  startedAt: number;
  endedAt: number;
}

interface Options {
  enabled: boolean;
  inspection: boolean;
  holdMs: number;
  memoSplit: boolean;
  voice: boolean;
  onFinish: (solve: FinishedSolve) => void;
}

const INSPECTION_MS = 15_000;
const DNF_AFTER_MS = 17_000;

export function inspectionPenalty(elapsedMs: number): Penalty {
  if (elapsedMs > DNF_AFTER_MS) return "dnf";
  if (elapsedMs > INSPECTION_MS) return "+2";
  return "none";
}

/** Wall-clock time of a performance.now() timestamp. */
const wallClock = (perfTime: number) => Math.round(performance.timeOrigin + perfTime);

/** Stops any spoken callout, including one already queued. */
function hush() {
  try {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  } catch {
    // Nothing to stop.
  }
}

/** Input types where the space bar doesn't type anything. */
const NON_TEXT_INPUTS = new Set(["button", "checkbox", "radio", "range", "color", "file", "submit", "reset", "image"]);

/** Whether the space bar would type a space here (so the timer leaves it alone). */
export function isTextEntry(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return !NON_TEXT_INPUTS.has(target.type);
  return target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable);
}

function speak(text: string) {
  try {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Voice callouts are a nicety; the countdown still shows.
  }
}

export function useTimer({ enabled, inspection, holdMs, memoSplit, voice, onFinish }: Options) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const phaseRef = useRef<TimerPhase>("idle");
  const startRef = useRef(0);
  const inspectionStartRef = useRef<number | null>(null);
  const memoRef = useRef<number | null>(null);
  const pointerRef = useRef<number | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calloutTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [startedAt, setStartedAt] = useState(0);
  const [inspectionStartedAt, setInspectionStartedAt] = useState<number | null>(null);
  const [memoMs, setMemoMs] = useState<number | null>(null);
  // The latest options, read by the input handlers without re-binding them.
  const optionsRef = useRef({ inspection, holdMs, memoSplit, voice, onFinish });
  useEffect(() => {
    optionsRef.current = { inspection, holdMs, memoSplit, voice, onFinish };
  }, [inspection, holdMs, memoSplit, voice, onFinish]);

  const go = useCallback((next: TimerPhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);
  /** Cancels inspection's "8 seconds" and "12 seconds" callouts, including one being spoken. */
  const clearCallouts = useCallback(() => {
    const hadCallouts = calloutTimers.current.length > 0;
    calloutTimers.current.forEach(clearTimeout);
    calloutTimers.current = [];
    if (hadCallouts) hush();
  }, []);

  const beginInspection = useCallback((time: number) => {
    inspectionStartRef.current = time;
    setInspectionStartedAt(time);
    clearCallouts();
    if (optionsRef.current.voice) {
      calloutTimers.current = [
        setTimeout(() => speak("Eight seconds"), 8000),
        setTimeout(() => speak("Twelve seconds"), 12000),
      ];
    }
    go("inspecting");
  }, [go, clearCallouts]);

  const press = useCallback((time: number) => {
    const current = phaseRef.current;
    if (current === "running") {
      if (optionsRef.current.memoSplit && memoRef.current === null) {
        memoRef.current = time - startRef.current;
        setMemoMs(memoRef.current);
        return;
      }
      const elapsed = Math.round(time - startRef.current);
      const penalty = inspectionStartRef.current === null ? "none" : inspectionPenalty(startRef.current - inspectionStartRef.current);
      go("stopped");
      clearCallouts();
      optionsRef.current.onFinish({
        timeMs: elapsed,
        penalty,
        memoMs: memoRef.current === null ? null : Math.round(memoRef.current),
        startedAt: wallClock(startRef.current),
        endedAt: wallClock(time),
      });
      return;
    }
    if (current === "idle") {
      if (optionsRef.current.inspection) return; // Inspection starts on release.
    } else if (current !== "inspecting") {
      return;
    }
    go("holding");
    clearHold();
    holdTimer.current = setTimeout(() => {
      if (phaseRef.current === "holding") go("ready");
    }, optionsRef.current.holdMs);
  }, [go, clearHold, clearCallouts]);

  const release = useCallback((time: number) => {
    const current = phaseRef.current;
    clearHold();
    if (current === "idle" && optionsRef.current.inspection) {
      beginInspection(time);
    } else if (current === "holding") {
      go(inspectionStartRef.current === null ? "idle" : "inspecting");
    } else if (current === "ready") {
      // Inspection is over: no callouts once the solve has started.
      clearCallouts();
      startRef.current = time;
      memoRef.current = null;
      setMemoMs(null);
      setStartedAt(time);
      go("running");
    } else if (current === "stopped") {
      inspectionStartRef.current = null;
      setInspectionStartedAt(null);
      go("idle");
    }
  }, [beginInspection, go, clearHold, clearCallouts]);

  /** Stops inspection or a solve without saving anything. */
  const cancel = useCallback(() => {
    clearHold();
    clearCallouts();
    inspectionStartRef.current = null;
    setInspectionStartedAt(null);
    go("idle");
  }, [go, clearHold, clearCallouts]);

  useEffect(() => {
    if (!enabled) return undefined;
    const isSpace = (e: KeyboardEvent) => e.code === "Space";
    const typing = (e: Event) => isTextEntry(e.target);
    const dialogOpen = () => document.querySelector("dialog[open]") !== null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (typing(e) || dialogOpen()) return;
      if (e.repeat) {
        if (isSpace(e)) e.preventDefault();
        return;
      }
      const current = phaseRef.current;
      if (current === "running") {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        press(e.timeStamp);
        return;
      }
      if (e.code === "Escape" && current !== "idle") {
        e.preventDefault();
        cancel();
        return;
      }
      if (isSpace(e)) {
        e.preventDefault();
        press(e.timeStamp);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // In a dialog the space bar works its controls as usual.
      if (typing(e) || (dialogOpen() && phaseRef.current === "idle")) return;
      const current = phaseRef.current;
      if (isSpace(e) || current === "stopped") {
        // Keeps a focused button, menu or checkbox from reacting to the space bar.
        if (isSpace(e)) e.preventDefault();
        release(e.timeStamp);
      }
    };
    // Switching away mid-press loses the key release: don't leave the timer armed.
    const onBlur = () => {
      clearHold();
      if (phaseRef.current === "holding" || phaseRef.current === "ready") go(inspectionStartRef.current === null ? "idle" : "inspecting");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [enabled, press, release, cancel, clearHold, go]);

  // Stop hold and callout timers if the component goes away mid-solve.
  useEffect(() => () => {
    clearHold();
    clearCallouts();
  }, [clearHold, clearCallouts]);

  /** Pointer handlers for the timer area (touch screens, or clicking with a mouse). */
  const surfaceHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (!enabled || e.button !== 0) return;
      const running = phaseRef.current === "running";
      // A mouse click only stops a running solve; starting is for the space bar, or a touch or pen.
      if (e.pointerType === "mouse" && !running) return;
      // Buttons and fields on the timer screen work as usual, except that any touch stops a running solve.
      const onControl = e.target instanceof Element && e.target.closest("button, a, input, textarea, select, label, summary, details");
      if (onControl && !running) return;
      pointerRef.current = e.pointerId;
      // Keep getting this pointer's release even if the thumb slides off the timer.
      e.currentTarget.setPointerCapture?.(e.pointerId);
      press(e.timeStamp);
    },
    onPointerUp: (e: React.PointerEvent) => {
      // Only the release of a press the timer took counts (not a click on a button).
      if (pointerRef.current !== e.pointerId) return;
      pointerRef.current = null;
      if (enabled) release(e.timeStamp);
    },
    onPointerCancel: () => {
      pointerRef.current = null;
      if (phaseRef.current === "holding" || phaseRef.current === "ready") go(inspectionStartRef.current === null ? "idle" : "inspecting");
    },
  };

  return { phase, startedAt, inspectionStartedAt, memoMs, surfaceHandlers, cancel };
}
