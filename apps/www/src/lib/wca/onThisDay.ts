// "On this day in my cubing": which competitions from past years fall on a
// given date. Only dates and types live here, with no WCA formatting code, so
// the browser can match against its own date (see components/cubing/OnThisDay).
// The moments themselves are built on the server by `cubingMoments` in moments.ts.

export interface MomentHighlight {
  key: string;
  kind: "podium" | "pr";
  /** e.g. "Gold in Square-1" or "3x3x3 Cube single · 7.12". */
  label: string;
  iconClass: string;
  medal?: "gold" | "silver" | "bronze";
  /** "NR", "CR", "WR" etc. when a PR was also a regional record. */
  record?: string;
  /** A barrier a PR broke, e.g. "Sub-10". */
  milestone?: string;
  /** The first result in that event, rather than an improvement. */
  first?: boolean;
}

/** A competition I competed in or delegated, with what happened there. */
export interface CubingMoment {
  competitionId: string;
  competitionName: string;
  url: string;
  start: string;
  end: string;
  /** "City, State" as the WCA writes it; absent for a competition only known from its results. */
  city?: string;
  countryIso2?: string;
  competed: boolean;
  delegated: boolean;
  /** Which competition this was in my career (1 for the first); delegate-only competitions don't count. */
  competitionNumber?: number;
  /** Which competition I delegated this was, counting every one I delegated. */
  delegatedNumber?: number;
  /** Podiums first, then the most notable PRs; at most a few, with `moreHighlights` counting the rest. */
  highlights: MomentHighlight[];
  moreHighlights: number;
}

/** 1 → "1st", 22 → "22nd", 113 → "113th". */
export function ordinal(n: number): string {
  const tens = n % 100;
  const suffix = tens >= 11 && tens <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
  return `${n}${suffix}`;
}

export interface MomentMatch extends CubingMoment {
  yearsAgo: number;
}

export interface MomentsOnDay {
  /** "day" for matches on the date itself, "week" for the ±`windowDays` fallback. */
  range: "day" | "week";
  moments: MomentMatch[];
}

const DAY_MS = 86_400_000;
// A competition longer than this is listed by its first week only, so a bad end date can't loop for long.
const MAX_COMPETITION_DAYS = 7;

const isLeapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const year = (iso: string) => Number(iso.slice(0, 4));

/** The month and day of `iso` in another year; Feb 29 falls on Feb 28 when that year has no Feb 29. */
function inYear(iso: string, target: number): number {
  const monthDay = iso.slice(5) === "02-29" && !isLeapYear(target) ? "02-28" : iso.slice(5);
  return toTime(`${String(target).padStart(4, "0")}-${monthDay}`);
}

/** Days between `iso`'s month and day and `today`'s, ignoring the year, so Dec 30 is 3 days from Jan 2. */
function daysApart(iso: string, today: string): number {
  const now = toTime(today);
  const thisYear = year(today);
  return Math.min(...[thisYear - 1, thisYear, thisYear + 1].map((y) => Math.abs(inYear(iso, y) - now) / DAY_MS));
}

/** Each day of a competition, from its start to its end. */
function competitionDays({ start, end }: { start: string; end: string }): string[] {
  const days = [start];
  for (let time = toTime(start) + DAY_MS; time <= toTime(end) && days.length < MAX_COMPETITION_DAYS; time += DAY_MS) {
    days.push(new Date(time).toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Competitions from past years that ran on `today`'s month and day (any day of
 * a multi-day competition counts), newest first and at most `limit`. With
 * none, those within `windowDays` of it instead; null when there are none of those either.
 */
export function momentsOn(
  moments: CubingMoment[],
  today: string,
  { limit = 5, windowDays = 3 } = {},
): MomentsOnDay | null {
  const past = moments
    .filter((moment) => year(moment.start) < year(today))
    .map((moment) => ({ moment, distance: Math.min(...competitionDays(moment).map((day) => daysApart(day, today))) }));
  const pick = (maxDistance: number) =>
    past
      .filter(({ distance }) => distance <= maxDistance)
      .map(({ moment }) => ({ ...moment, yearsAgo: year(today) - year(moment.start) }))
      .toSorted((a, b) => b.start.localeCompare(a.start) || a.competitionId.localeCompare(b.competitionId))
      .slice(0, limit);
  const onDay = pick(0);
  if (onDay.length > 0) return { range: "day", moments: onDay };
  const inWeek = pick(windowDays);
  return inWeek.length > 0 ? { range: "week", moments: inWeek } : null;
}
