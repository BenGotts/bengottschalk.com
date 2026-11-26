"use client";

import { useEffect } from "react";
import { FaTrophy, FaXmark } from "react-icons/fa6";
import type { Achievement } from "@bengottschalk/timer-core/achievements";
import { rewardsFor } from "@/lib/rewards";

interface Props {
  fresh: Achievement[];
  backfilled: number;
  /** Only while the timer is idle: never in the middle of a solve. */
  show: boolean;
  onOpen: () => void;
  onDismiss: () => void;
}

const SHOW_MS = 6000;

/** Announces achievements just earned (or, once, those already earned from past solves). */
export default function AchievementToast({ fresh, backfilled, show, onOpen, onDismiss }: Props) {
  const visible = show && (fresh.length > 0 || backfilled > 0);

  useEffect(() => {
    if (!visible) return undefined;
    const timeout = setTimeout(onDismiss, SHOW_MS);
    return () => clearTimeout(timeout);
  // onDismiss changes as more are earned, which starts the wait again.
  }, [visible, onDismiss]);

  if (!visible) return null;

  const first = fresh[0];
  const rewards = fresh.flatMap((a) => rewardsFor(a.id));
  let title: string;
  let detail: string;
  if (backfilled > 0 && fresh.length === 0) {
    title = `${backfilled.toLocaleString("en-US")} achievements from your past solves`;
    detail = "See what you've earned, and what's next.";
  } else if (fresh.length === 1) {
    title = first.title;
    detail = first.description;
  } else {
    title = `${fresh.length} achievements earned`;
    detail = fresh.slice(0, 3).map((a) => a.title).join(", ") + (fresh.length > 3 ? "…" : "");
  }

  return (
    <output className="focus-fade toast toast-center toast-bottom z-30 mb-16 lg:mb-4" data-timer-ignore>
      <div className="alert alert-soft border-ink-gold/40 shadow-lg">
        <FaTrophy className="size-5 shrink-0 text-ink-gold" aria-hidden />
        <button type="button" className="min-w-0 text-left" onClick={onOpen}>
          <span className="block text-xs text-muted">{backfilled > 0 && fresh.length === 0 ? "Welcome to achievements" : "Achievement earned"}</span>
          <span className="block font-medium">{title}</span>
          <span className="block text-sm text-muted">{detail}</span>
          {rewards.length > 0 && <span className="mt-1 block text-sm text-accent">Unlocked: {rewards.map((r) => r.name).join(", ")}</span>}
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={onDismiss} aria-label="Dismiss"><FaXmark aria-hidden /></button>
      </div>
    </output>
  );
}
