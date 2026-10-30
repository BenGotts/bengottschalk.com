/** Year and month, e.g. `"2022-10"`. */
export type YearMonth = `${number}-${number}`;

export interface DateSpan {
  start: YearMonth;
  /** `null` means ongoing. */
  end: YearMonth | null;
}

const monthFormat = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

/** `"2022-10"` → `"Oct 2022"`. */
export function formatYearMonth(value: YearMonth): string {
  const [year, month] = value.split("-").map(Number);
  return monthFormat.format(new Date(Date.UTC(year, month - 1)));
}

/** `"Oct 2022 - Sep 2023"`, `"Dec 2023 - Present"`, or `"Mar 2022"` for a single month. */
export function formatDateSpan({ start, end }: DateSpan): string {
  if (start === end) return formatYearMonth(start);
  return `${formatYearMonth(start)} - ${end ? formatYearMonth(end) : "Present"}`;
}

/** Newest start first; for equal starts, ongoing first, then latest end. */
export function compareNewestFirst(a: DateSpan, b: DateSpan): number {
  return b.start.localeCompare(a.start) || (b.end ?? "9999-12").localeCompare(a.end ?? "9999-12");
}
