import { timerEvent } from "./events";

export type Penalty = "none" | "+2" | "dnf";

/** Where a solve came from. Competition attempts arrive with WCA results (step 3). */
export type SolveSource = "home" | "competition";

/** Where a competition attempt came from, for solves with `source: "competition"`. */
export interface CompetitionAttempt {
  competitionId: string;
  competitionName: string;
  /** WCA round type, like "1", "2", "f" (final) or "c" (combined final). */
  roundTypeId: string;
  /** 1-based attempt number within the round. */
  attempt: number;
  /** "live" from WCA Live during the competition; "official" once results are posted (replacing the live one). */
  status: "live" | "official";
  /** How `startedAt` was worked out: the competitor's group slot, the round's slot, or just the day. */
  /**
   * How `startedAt` was worked out: "entered" from when WCA Live recorded the
   * result (within the person's group), "group" from their group's slot,
   * "round" from the round's slot, "day" with only the date known.
   */
  timeEstimate: "entered" | "group" | "round" | "day";
  /** The round's number at the competition (1, 2, …), when the schedule says. */
  roundNumber: number | null;
  /** How the competitor placed in the round, when known. */
  position: number | null;
  /** The round's average or mean as the WCA stores it (centiseconds; FMC × 100; 0 none, -1 DNF). */
  roundAverage: number | null;
  /** Records set in the round, like "NR" (official) or "PR" (WCA Live). */
  singleRecord: string | null;
  averageRecord: string | null;
}

/**
 * Competition attempts have fixed ids, so refreshing results (or the official
 * results replacing WCA Live's) updates the same solve and keeps its Solve of
 * the Day mark.
 */
export const competitionSolveId = (competitionId: string, eventId: string, roundTypeId: string, attempt: number): string =>
  `wca-${competitionId}-${eventId}-${roundTypeId}-${attempt}`;

/**
 * How a time was taken. New hardware gets a new value here (and a label
 * below); the server accepts any short lowercase name, so a newer device's
 * method still syncs.
 *
 * - keyboard: the space bar
 * - touch: holding the screen
 * - typed: typed in (also Fewest Moves results)
 * - stackmat: a Stackmat timer plugged in (to come)
 * - bluetooth: a Bluetooth timer or smart cube (to come)
 * - imported: brought in from csTimer
 * - competition: an official or WCA Live attempt (timed by the judges)
 */
export type TimingMethod = "keyboard" | "touch" | "typed" | "stackmat" | "bluetooth" | "imported" | "competition";

export const TIMING_LABELS: Record<TimingMethod | "unknown", string> = {
  keyboard: "Space bar",
  touch: "Touch screen",
  typed: "Typed",
  stackmat: "Stackmat",
  bluetooth: "Bluetooth",
  imported: "Imported from csTimer",
  competition: "Competition (judged)",
  unknown: "Not recorded",
};

/**
 * How a solve was timed. Solves saved before this was recorded have no
 * `timing`, so it's worked out from where they came from; a timer solve from
 * then could have been the space bar or a touch, so that's "unknown".
 */
export function timingOf(solve: Pick<Solve, "timing" | "entry" | "source">): TimingMethod | "unknown" {
  if (solve.timing) return solve.timing;
  if (solve.source === "competition") return "competition";
  if (solve.entry === "typed") return "typed";
  if (solve.entry === "import") return "imported";
  if (solve.entry === "stackmat") return "stackmat";
  return "unknown";
}

/**
 * Whether the solve's own time is known. The WCA records no time for a DNF
 * or DNS attempt (its timeMs is 0); a DNF done here still has the time it
 * was stopped at.
 */
export const rawTimeKnown = (solve: Pick<Solve, "source" | "penalty" | "timeMs">): boolean =>
  !(solve.source === "competition" && solve.penalty === "dnf") && solve.timeMs > 0;

export interface MultiBlindResult {
  solved: number;
  attempted: number;
}

export interface Solve {
  /** A UUIDv7, made on the device, so solves sync without clashing. */
  id: string;
  eventId: string;
  /** The session the solve was done in: a main session or a branch. It never changes, even after a merge. */
  sessionId: string;
  /** The time in whole milliseconds, without the penalty. For FMC, the time spent (if timed). */
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  comment: string;
  /** When the solve started (wall clock, ms since 1970). Sorts solves and lines them up with recordings. */
  startedAt: number;
  /** When it stopped (wall clock). Missing for typed and imported solves. */
  endedAt: number | null;
  source: SolveSource;
  /** Competition attempts only (read-only, from WCA results); null for home solves. */
  competition: CompetitionAttempt | null;
  /** Blindfolded: how long memorisation took, when split. */
  memoMs: number | null;
  /** FMC: the solution and its move count. */
  fmc: { solution: string; moves: number } | null;
  /** Multi-Blind: cubes solved out of attempted. */
  multi: MultiBlindResult | null;
  /** How the time was entered (kept for older devices; `timing` says more). */
  entry: "timer" | "typed" | "stackmat" | "import";
  /** How the time was taken. Missing on solves saved before it was recorded: use `timingOf`. */
  timing?: TimingMethod | null;
  createdAt: number;
  updatedAt: number;
  /** Deleted solves are kept (marked) so the deletion reaches other devices. */
  deletedAt: number | null;
}

/** Whether a Multi-Blind result counts: at least 2 solved, and no more unsolved than solved. */
export function multiBlindPoints({ solved, attempted }: MultiBlindResult): number | null {
  const unsolved = attempted - solved;
  if (solved < 2 || solved < unsolved) return null;
  return solved - unsolved;
}

/**
 * The value stats are worked out from: milliseconds with any +2, the move
 * count for FMC, or `Infinity` for a DNF. Multi-Blind is ranked separately
 * (see `compareMultiBlind`); its value is its time, or `Infinity` for a DNF.
 */
export function solveValue(solve: Pick<Solve, "eventId" | "timeMs" | "penalty" | "fmc" | "multi">): number {
  if (solve.penalty === "dnf") return Infinity;
  const { kind } = timerEvent(solve.eventId);
  if (kind === "fewest-moves") return solve.fmc ? solve.fmc.moves : Infinity;
  if (kind === "multi-blind" && (!solve.multi || multiBlindPoints(solve.multi) === null)) return Infinity;
  return solve.timeMs + (solve.penalty === "+2" ? 2000 : 0);
}

/** Multi-Blind ranking: more points, then less time, then fewer unsolved. Negative when `a` is better. */
export function compareMultiBlind(a: Solve, b: Solve): number {
  const points = (s: Solve) => (s.penalty === "dnf" || !s.multi ? null : multiBlindPoints(s.multi));
  const pa = points(a);
  const pb = points(b);
  if (pa === null || pb === null) return pa === pb ? 0 : pa === null ? 1 : -1;
  if (pa !== pb) return pb - pa;
  const time = solveValue(a) - solveValue(b);
  if (time !== 0) return time;
  return (a.multi!.attempted - a.multi!.solved) - (b.multi!.attempted - b.multi!.solved);
}

/** Multi-Blind's time limit: ten minutes a cube, an hour at most. */
export function multiBlindTimeLimitMs(cubes: number): number {
  return Math.min(cubes, 6) * 600_000;
}

/** FMC solutions count outer block turns: rotations are free, slice moves count 2. */
export function countFmcMoves(solution: string): number | null {
  const withoutComments = solution.replaceAll(/\/\/.*$/gm, "");
  const tokens = withoutComments.trim().split(/\s+/).filter(Boolean);
  let moves = 0;
  for (const token of tokens) {
    if (!/^(?:[URFDLB]w?|[urfdlb]|[MES]|[xyz])(?:2|')?$/.test(token)) return null;
    const face = token[0];
    if ("xyz".includes(face)) continue;
    moves += "MES".includes(face) ? 2 : 1;
  }
  return moves;
}
