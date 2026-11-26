"use client";

import { useEffect, useState } from "react";
import { formatRunning, formatTime, type Precision } from "@bengottschalk/timer-core/time";
import type { TimerPhase } from "@/lib/useTimer";
import { inspectionPenalty } from "@/lib/useTimer";
import type { PhaseColors } from "@/lib/rewards";

interface Props {
  phase: TimerPhase;
  startedAt: number;
  inspectionStartedAt: number | null;
  memoMs: number | null;
  /** The last solve's result text, shown when idle. */
  lastResult: string | null;
  precision: Precision;
  hideRunningTime: boolean;
  /** The time's colors while holding, ready and inspecting (a reward). */
  colors: Pick<PhaseColors, "holding" | "ready" | "inspecting">;
  /** Set to a new value (the solve's id) to make the time glow, for a new best. */
  glow?: string | null;
}

/** Re-renders every frame while `active`, returning performance.now(). */
function useFrameClock(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    const tick = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return now;
}

export default function TimeDisplay({ phase, startedAt, inspectionStartedAt, memoMs, lastResult, precision, hideRunningTime, colors, glow = null }: Props) {
  const inspecting = inspectionStartedAt !== null && (phase === "inspecting" || phase === "holding" || phase === "ready");
  const now = useFrameClock(phase === "running" || inspecting);

  let text: string;
  let note: string | null = null;
  if (phase === "running") {
    text = hideRunningTime ? "solve" : formatRunning(now - startedAt, precision);
    if (memoMs !== null) note = `memo ${formatTime(memoMs, precision)}`;
  } else if (inspecting) {
    const elapsed = Math.max(0, now - inspectionStartedAt);
    const penalty = inspectionPenalty(elapsed);
    text = penalty === "dnf" ? "DNF" : penalty === "+2" ? "+2" : String(Math.max(1, 15 - Math.floor(elapsed / 1000)));
  } else if (phase === "holding" || phase === "ready") {
    text = formatRunning(0, precision);
  } else {
    text = lastResult ?? formatRunning(0, precision);
  }

  const color = phase === "ready" ? colors.ready : phase === "holding" ? colors.holding : inspecting ? colors.inspecting : "";

  return (
    <div className="flex flex-col items-center" aria-live={phase === "idle" || phase === "stopped" ? "polite" : "off"}>
      {/* Long results (Multi-Blind's "6/7 54:12.34" or "DNF (2/7 58:01.20)") get smaller so they stay on one line. */}
      {/* Keyed by the glow, so each new best plays it from the start. */}
      <div key={glow ?? "steady"} className={`timer-digits whitespace-nowrap ${glow ? "pb-glow" : ""} font-medium leading-none ${text.length > 12 ? "text-[clamp(1.75rem,7.5vw,5.5rem)]" : text.length > 8 ? "text-[clamp(2.5rem,10.5vw,7.5rem)]" : "text-[clamp(4rem,18vw,11rem)]"} ${color}`}>{text}</div>
      <div className="mt-3 h-6 text-sm text-muted">{note}</div>
    </div>
  );
}
