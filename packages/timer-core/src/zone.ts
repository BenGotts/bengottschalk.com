// Dates and time zones.
//
// The WCA (WCIF and WCA Live) gives moments as UTC ISO strings, and dates
// (`YYYY-MM-DD`) in the competition venue's own time zone. The timer keeps
// moments as milliseconds since 1970, and anything that depends on the
// calendar ("which day was this solve", "is the competition on today") is
// worked out in a time zone named explicitly: the person's own (the browser's)
// or the venue's. Servers run in UTC, so nothing here relies on the process's
// time zone unless no zone is given (in a browser, that's the person's).

/** Reads an ISO moment that says its offset (`…Z` or `…+02:00`); null otherwise, so it's never taken as local time. */
export function parseInstant(iso: string): number | null {
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(iso.trim())) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Whether `timeZone` is an IANA zone this runtime knows (like `America/Los_Angeles`). */
export function isTimeZone(timeZone: unknown): timeZone is string {
  if (typeof timeZone !== "string" || timeZone.length === 0 || timeZone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

const formatters = new Map<string, Intl.DateTimeFormat>();
function partsIn(ms: number, timeZone: string) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    formatters.set(timeZone, format);
  }
  const parts = format.formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The calendar day of a moment, `YYYY-MM-DD`, in `timeZone`; without one, in
 * this runtime's own zone (the person's, in a browser).
 */
export function localDate(ms: number, timeZone?: string | null): string {
  if (timeZone && isTimeZone(timeZone)) {
    const p = partsIn(ms, timeZone);
    return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
  }
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** A `YYYY-MM-DD` date moved by whole days (calendar arithmetic, no time zone involved). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const moved = new Date(Date.UTC(y, m - 1, d + days));
  return `${moved.getUTCFullYear()}-${pad(moved.getUTCMonth() + 1)}-${pad(moved.getUTCDate())}`;
}

/** Milliseconds since 1970 for a wall-clock time on a date in a time zone (UTC when no zone is given). */
export function zonedTime(date: string, hour: number, timeZone: string | null): number {
  const [y, m, d] = date.split("-").map(Number);
  const utcGuess = Date.UTC(y, m - 1, d, hour);
  if (!timeZone || !isTimeZone(timeZone)) return utcGuess;
  // The zone's offset at that moment: read the UTC guess as wall-clock time in the zone and compare.
  const p = partsIn(utcGuess, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return utcGuess - (asIfUtc - utcGuess);
}

/** The moment a date ends (midnight after it) in a time zone. */
export const endOfDay = (date: string, timeZone: string | null): number => zonedTime(addDays(date, 1), 0, timeZone);
