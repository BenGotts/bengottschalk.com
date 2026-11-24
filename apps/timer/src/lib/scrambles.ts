// Official random-state scrambles from cubing.js, the library behind WCA
// scrambling. It runs its search in a web worker, so the page never stalls.

import { timerEvent } from "@bengottschalk/timer-core/events";
import { loadAlg, loadPuzzles, loadScramble } from "./cubing";

/** One scramble for an event. Multi-Blind and the other blindfolded 3×3 events use 3BLD scrambles. */
export async function generateScramble(eventId: string): Promise<string> {
  const { randomScrambleForEvent } = await loadScramble();
  const id = eventId === "333mbf" ? "333bf" : timerEvent(eventId).scrambleId;
  const alg = await randomScrambleForEvent(id);
  return alg.toString();
}

/** Multi-Blind: one scramble per cube. */
export async function generateMultiBlindScrambles(cubes: number): Promise<string[]> {
  return Promise.all(Array.from({ length: cubes }, () => generateScramble("333bf")));
}

/** Whether an FMC solution solves the scramble (any final orientation of the whole cube). */
export async function solvesScramble(scramble: string, solution: string): Promise<boolean> {
  const [{ cube3x3x3 }, { Alg }] = await Promise.all([loadPuzzles(), loadAlg()]);
  const kpuzzle = await cube3x3x3.kpuzzle();
  try {
    const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble)).applyAlg(new Alg(solution));
    return pattern.experimentalIsSolved({ ignorePuzzleOrientation: true, ignoreCenterOrientation: true });
  } catch {
    return false;
  }
}
