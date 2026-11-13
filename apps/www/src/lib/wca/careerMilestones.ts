import type { HistoryEntry } from "./competitions";
import { ordinal } from "./onThisDay";

export interface CompetitionNumbers {
  /** Which competition this was in my career (1 for the first); absent for a delegate-only one. */
  competition?: number;
  /** Which competition I delegated this was, counting every one I delegated. */
  delegated?: number;
}

/**
 * Numbers each competition oldest first, the way the stat tiles count them: a
 * delegate-only competition is a delegated one but not one I competed in.
 * Competitions on the same day go in name order, as in the history.
 */
export function competitionNumbers(history: HistoryEntry[]): Map<string, CompetitionNumbers> {
  const numbers = new Map<string, CompetitionNumbers>();
  let competed = 0;
  let delegated = 0;
  for (const entry of history.toSorted((a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name))) {
    numbers.set(entry.id, {
      ...(entry.competed && { competition: ++competed }),
      ...(entry.delegated && { delegated: ++delegated }),
    });
  }
  return numbers;
}

/** Counts worth marking: the first, 10th, 25th, 50th, 75th and 100th, then every 50th. */
export const isMilestoneCount = (n: number) => [1, 10, 25, 50, 75].includes(n) || (n > 0 && n % 50 === 0);

export interface CareerMilestone {
  kind: "competition" | "delegated";
  number: number;
  /** e.g. "100th competition", "First competition as Delegate". */
  label: string;
}

export interface CompetitionMilestones {
  competitionId: string;
  competitionName: string;
  date: string;
  milestones: CareerMilestone[];
}

/** The competitions where I reached a milestone count, competing or delegating, newest first. */
export function careerMilestones(history: HistoryEntry[]): CompetitionMilestones[] {
  const numbers = competitionNumbers(history);
  return history
    .map((entry) => {
      const { competition, delegated } = numbers.get(entry.id) ?? {};
      const milestones: CareerMilestone[] = [];
      if (competition !== undefined && isMilestoneCount(competition)) {
        milestones.push({ kind: "competition", number: competition, label: competition === 1 ? "First competition" : `${ordinal(competition)} competition` });
      }
      if (delegated !== undefined && isMilestoneCount(delegated)) {
        milestones.push({ kind: "delegated", number: delegated, label: delegated === 1 ? "First competition as Delegate" : `${ordinal(delegated)} as Delegate` });
      }
      return { competitionId: entry.id, competitionName: entry.name, date: entry.start_date, milestones };
    })
    .filter((entry) => entry.milestones.length > 0)
    .toSorted((a, b) => b.date.localeCompare(a.date) || b.competitionId.localeCompare(a.competitionId));
}
