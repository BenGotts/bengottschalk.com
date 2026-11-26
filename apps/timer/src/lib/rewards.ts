// Rewards: looks for the timer that achievements unlock. A new timer starts
// with a few; more open up with practice. Unlocks follow achievements, so
// they're worked out from solves too, and an earned look stays chosen only
// while its achievement still stands (otherwise the default is used).

import { ACHIEVEMENTS_BY_ID } from "@bengottschalk/timer-core/achievements";

export interface Reward {
  id: string;
  name: string;
  /** The achievement that unlocks it; none for the ones every timer starts with. */
  unlockedBy: string | null;
}

/** Colors for the time while holding, when ready to start, and during inspection (Tailwind classes, so they follow the light and dark themes). */
export interface PhaseColors extends Reward {
  holding: string;
  ready: string;
  inspecting: string;
}

export const PHASE_COLORS: readonly PhaseColors[] = [
  { id: "classic", name: "Classic", unlockedBy: null, holding: "text-error", ready: "text-success", inspecting: "text-warning" },
  // No red against green, for red-green color blindness.
  { id: "contrast", name: "Blue and orange", unlockedBy: null, holding: "text-ink-orange", ready: "text-info", inspecting: "text-warning" },
  { id: "royal", name: "Royal", unlockedBy: "solves:1000", holding: "text-ink-purple", ready: "text-ink-gold", inspecting: "text-info" },
  { id: "aurora", name: "Aurora", unlockedBy: "streak:30", holding: "text-ink-red", ready: "text-info", inspecting: "text-ink-purple" },
  { id: "medal", name: "Medals", unlockedBy: "comp:podium", holding: "text-ink-bronze", ready: "text-ink-gold", inspecting: "text-ink-silver" },
  { id: "blindfold", name: "Blindfold", unlockedBy: "bld-run:5", holding: "text-muted", ready: "text-primary", inspecting: "text-secondary" },
];

export type CelebrationStyle = "label" | "glow" | "confetti" | "cube-confetti" | "gold-rain" | "fireworks";

/** What happens on a new best single. */
export interface Celebration extends Reward {
  id: CelebrationStyle;
}

export const CELEBRATIONS: readonly Celebration[] = [
  { id: "label", name: "Just the label", unlockedBy: null },
  { id: "glow", name: "Glow", unlockedBy: null },
  { id: "confetti", name: "Confetti", unlockedBy: "pbs:10" },
  { id: "cube-confetti", name: "Cube confetti", unlockedBy: "streak:7" },
  { id: "fireworks", name: "Fireworks", unlockedBy: "pbs:50" },
  { id: "gold-rain", name: "Gold rain", unlockedBy: "comp-pbs:1" },
];

export const DEFAULT_PHASE_COLORS = "classic";
export const DEFAULT_CELEBRATION: CelebrationStyle = "glow";

export const isUnlocked = (reward: Reward, earned: ReadonlySet<string>): boolean => reward.unlockedBy === null || earned.has(reward.unlockedBy);

/** How to unlock a reward, for a locked one: "Earn “1,000 solves”: Finish 1,000 solves". */
export function unlockHint(reward: Reward): string | null {
  if (reward.unlockedBy === null) return null;
  const achievement = ACHIEVEMENTS_BY_ID.get(reward.unlockedBy);
  return achievement ? `Earn “${achievement.title}”: ${achievement.description}` : null;
}

/** The chosen reward if it's unlocked, otherwise the default. */
function pick<T extends Reward>(list: readonly T[], id: string, fallback: string, earned: ReadonlySet<string>): T {
  const chosen = list.find((r) => r.id === id);
  return chosen && isUnlocked(chosen, earned) ? chosen : list.find((r) => r.id === fallback)!;
}

export const phaseColorsFor = (id: string, earned: ReadonlySet<string>): PhaseColors => pick(PHASE_COLORS, id, DEFAULT_PHASE_COLORS, earned);
export const celebrationFor = (id: string, earned: ReadonlySet<string>): Celebration => pick(CELEBRATIONS, id, DEFAULT_CELEBRATION, earned);

/** Rewards an achievement unlocks. */
export function rewardsFor(achievementId: string): Reward[] {
  return [...PHASE_COLORS, ...CELEBRATIONS].filter((r) => r.unlockedBy === achievementId);
}
