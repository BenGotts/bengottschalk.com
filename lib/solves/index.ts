import fs from "fs";
import path from "path";
import {
  DailySolves,
  SOLVE_OF_DAY_EVENTS,
  SolveEvent,
  SolveOfTheDay,
  isSolveEvent,
} from "./types";

const SOLVES_DIR = path.join(process.cwd(), "content", "solves");

/** Today's date in Pacific Time (YYYY-MM-DD). */
export function getTodayDatePT(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
}

function getDailySolvesFilePath(date: string): string {
  const [year, month] = date.split("-");
  return path.join(SOLVES_DIR, year, month, `${date}.json`);
}

export function getDailySolves(date: string): DailySolves | null {
  const filePath = getDailySolvesFilePath(date);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw) as DailySolves;

  return {
    ...data,
    solves: data.solves.filter((s) => isSolveEvent(s.event)),
  };
}

export function getTodaySolves(): DailySolves | null {
  return getDailySolves(getTodayDatePT());
}

export function getSolveByDateAndEvent(
  date: string,
  event: SolveEvent
): SolveOfTheDay | null {
  const daily = getDailySolves(date);
  return daily?.solves.find((s) => s.event === event) ?? null;
}

export function getSolveDetailPath(date: string, event: SolveEvent): string {
  return `/content/${date}/${event}`;
}

export function truncateScramble(scramble: string, maxWords = 6): string {
  const words = scramble.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return scramble.trim();
  }
  return `${words.slice(0, maxWords).join(" ")}…`;
}

export function formatSolveDisplayTime(solve: SolveOfTheDay): string | null {
  if (solve.timeFormatted) {
    return solve.timeFormatted;
  }
  if (solve.timeMs != null) {
    return (solve.timeMs / 1000).toFixed(2);
  }
  return null;
}

/** Ensures all three events appear in display order, with null for missing entries. */
export function getTodaySolvesByEvent(): Record<SolveEvent, SolveOfTheDay | null> {
  const daily = getTodaySolves();
  const byEvent = {} as Record<SolveEvent, SolveOfTheDay | null>;

  for (const event of SOLVE_OF_DAY_EVENTS) {
    byEvent[event] = daily?.solves.find((s) => s.event === event) ?? null;
  }

  return byEvent;
}

export { SOLVE_OF_DAY_EVENTS, isSolveEvent };
export { hasReconstruction } from "./types";
export type { DailySolves, SolveEvent, SolveOfTheDay };
