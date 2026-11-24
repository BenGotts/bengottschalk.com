// Multi-Blind results, the WCA way. An attempt scores points: cubes solved
// minus cubes not solved. It's a DNF with fewer than 2 solved, with fewer
// points than 0, or over the time limit (stored as a DNF penalty). Results
// rank by more points, then less time, then fewer cubes missed. There's no
// rolling average: each attempt stands on its own.

import { compareMultiBlind, multiBlindPoints, type Solve } from "./solve";

type MultiSolve = Pick<Solve, "penalty" | "multi">;

/** The attempt's points, or null when it's a DNF. */
export function multiBlindResultPoints(solve: MultiSolve): number | null {
  if (solve.penalty === "dnf" || !solve.multi) return null;
  return multiBlindPoints(solve.multi);
}

/** Points as the cubes say, even for a DNF: solved minus missed (can be below 0). */
export function rawMultiBlindPoints(solve: MultiSolve): number | null {
  if (!solve.multi) return null;
  return solve.multi.solved - (solve.multi.attempted - solve.multi.solved);
}

export interface MultiBlindStats {
  attempts: number;
  /** Attempts that count (not DNF). */
  successes: number;
  /** Index of the best attempt by WCA ranking (the earliest of equals), or null with no successes. */
  bestIndex: number | null;
  /** Mean points over the attempts that count. */
  meanPoints: number | null;
  /** Cubes solved and attempted over every attempt. */
  cubesSolved: number;
  cubesAttempted: number;
}

/** Stats for Multi-Blind attempts in order (oldest first). */
export function multiBlindStats(solves: readonly Solve[]): MultiBlindStats {
  let bestIndex: number | null = null;
  let successes = 0;
  let pointsSum = 0;
  let cubesSolved = 0;
  let cubesAttempted = 0;
  solves.forEach((solve, index) => {
    if (solve.multi) {
      cubesSolved += solve.multi.solved;
      cubesAttempted += solve.multi.attempted;
    }
    const points = multiBlindResultPoints(solve);
    if (points === null) return;
    successes++;
    pointsSum += points;
    if (bestIndex === null || compareMultiBlind(solve, solves[bestIndex]) < 0) bestIndex = index;
  });
  return {
    attempts: solves.length,
    successes,
    bestIndex,
    meanPoints: successes > 0 ? pointsSum / successes : null,
    cubesSolved,
    cubesAttempted,
  };
}

/** The attempt's time in ms (with any +2), or null when it isn't known. */
export function multiBlindTimeMs(solve: Pick<Solve, "timeMs" | "penalty">): number | null {
  if (solve.timeMs <= 0) return null;
  return solve.timeMs + (solve.penalty === "+2" ? 2000 : 0);
}
