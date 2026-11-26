import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS_BY_ID } from "@bengottschalk/timer-core/achievements";
import { CELEBRATIONS, PHASE_COLORS, celebrationFor, isUnlocked, phaseColorsFor } from "./rewards";

const ALL = [...PHASE_COLORS, ...CELEBRATIONS];

describe("rewards", () => {
  it("are each unlocked by an achievement that exists", () => {
    for (const reward of ALL) if (reward.unlockedBy) expect(ACHIEVEMENTS_BY_ID.has(reward.unlockedBy)).toBe(true);
  });
  it("start with a few for a new timer", () => {
    const free = ALL.filter((r) => isUnlocked(r, new Set()));
    expect(free.map((r) => r.id)).toEqual(["classic", "contrast", "label", "glow"]);
  });
  it("fall back to the default when the chosen one is locked", () => {
    expect(phaseColorsFor("royal", new Set()).id).toBe("classic");
    expect(phaseColorsFor("royal", new Set(["solves:1000"])).id).toBe("royal");
    expect(celebrationFor("confetti", new Set()).id).toBe("glow");
    expect(celebrationFor("nonsense", new Set()).id).toBe("glow");
  });
});
