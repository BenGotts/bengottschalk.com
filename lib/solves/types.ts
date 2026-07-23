/** Events published in the daily Solve of the Day series. */
export const SOLVE_OF_DAY_EVENTS = ["333", "sq1", "333bf"] as const;

export type SolveEvent = (typeof SOLVE_OF_DAY_EVENTS)[number];

export interface ReconstructionStep {
  label: string;
  moves: string;
  comment?: string;
}

export interface Reconstruction {
  steps: ReconstructionStep[];
  summary?: string;
}

export interface SolveVideoLinks {
  youtube?: string;
  tiktok?: string;
}

export interface SolveOfTheDay {
  date: string;
  event: SolveEvent;
  scramble: string;
  timeMs?: number;
  timeFormatted?: string;
  videos?: SolveVideoLinks;
  reconstruction?: Reconstruction;
  tags?: string[];
  notes?: string;
}

export interface DailySolves {
  date: string;
  solves: SolveOfTheDay[];
}

export function isSolveEvent(value: string): value is SolveEvent {
  return (SOLVE_OF_DAY_EVENTS as readonly string[]).includes(value);
}

export function hasReconstruction(solve: SolveOfTheDay): boolean {
  return Boolean(solve.reconstruction?.steps?.length);
}
