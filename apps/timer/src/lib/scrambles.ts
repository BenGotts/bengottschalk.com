// Official random-state scrambles from cubing.js, the library behind WCA
// scrambling. It runs its search in a web worker, so the page never stalls.

import { timerEvent } from "@bengottschalk/timer-core/events";
import { parseSquare1 } from "@bengottschalk/timer-core/square1";
import { loadAlg, loadPuzzles, loadScramble } from "./cubing";

/**
 * cubing.js ends 3BLD scrambles with a random orientation like `Rw Dw'`; the
 * WCA's own scrambles (TNoodle) use `Uw` there, e.g. `Rw Uw'`. Either set
 * reaches all 24 orientations equally often, so swapping the final `Dw` for
 * `Uw` keeps the scramble just as random and makes it look like a real one.
 */
export function wcaOrientationSuffix(scramble: string): string {
  return scramble.replace(/\bDw(2|')?$/, "Uw$1");
}

/** One scramble for an event. Multi-Blind and the other blindfolded 3×3 events use 3BLD scrambles. */
export async function generateScramble(eventId: string): Promise<string> {
  const { randomScrambleForEvent } = await loadScramble();
  const id = eventId === "333mbf" ? "333bf" : timerEvent(eventId).scrambleId;
  const alg = await randomScrambleForEvent(id);
  return id === "333bf" ? wcaOrientationSuffix(alg.toString()) : alg.toString();
}

/** Multi-Blind: one scramble per cube. */
export async function generateMultiBlindScrambles(cubes: number): Promise<string[]> {
  return Promise.all(Array.from({ length: cubes }, () => generateScramble("333bf")));
}

/** The scramble undone (FMC solvers often look at the inverse), from cubing.js's `Alg.invert()`. */
export async function invertScramble(scramble: string): Promise<string> {
  const { Alg } = await loadAlg();
  // cubing.js writes the inverse of F2 as F2'; it's the same turn, and WCA scrambles write it F2.
  return new Alg(scramble).invert().toString().replaceAll("2'", "2");
}

/**
 * Whether an FMC solution solves the scramble (any final orientation of the
 * whole cube, since rotations are allowed). Pass the solution as a judge reads
 * it (`parseFmcSolution`), since cubing.js reads `r` as a wide move.
 */
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

export type ScrambleCheck = { ok: true; scramble: string } | { ok: false; error: string };

/**
 * Checks a typed-in scramble for an event: every move has to be one the
 * puzzle has (cubing.js's model of it, or our Square-1 reader). Returns the
 * scramble tidied (one space between moves) when it reads.
 */
export async function checkScramble(eventId: string, text: string): Promise<ScrambleCheck> {
  const event = timerEvent(eventId);
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return { ok: false, error: "Type or paste a scramble." };
  if (event.puzzleId === "square1") {
    return parseSquare1(trimmed) ? { ok: true, scramble: trimmed } : { ok: false, error: "That isn't Square-1 notation, like (1,0) / (-3,3) / …" };
  }
  const { Alg } = await loadAlg();
  let alg: InstanceType<typeof Alg>;
  try {
    alg = new Alg(trimmed);
  } catch (error) {
    return { ok: false, error: `That isn't move notation: ${error instanceof Error ? error.message : String(error)}` };
  }
  const loader = event.puzzleId ? (await loadPuzzles()).puzzles[event.puzzleId] : undefined;
  if (loader?.kpuzzle) {
    try {
      const kpuzzle = await loader.kpuzzle();
      kpuzzle.defaultPattern().applyAlg(alg);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `Not a ${event.shortName} scramble: ${detail}` };
    }
  }
  return { ok: true, scramble: alg.toString() };
}
