import { decodeMultiResult, formatCentiseconds, formatMultiResult } from "@wca/helpers";
import { eventResultType } from "./events";

export type ResultKind = "single" | "average";

/**
 * Formats a WCA result value for display.
 * - Times are centiseconds (`105` → `1.05`).
 * - FMC singles are move counts; FMC averages are moves × 100 (`2833` → `28.33`).
 * - Multi-Blind values use the WCA encoding (`960161200` → `3/3 26:52`).
 * - `0` means no result, `-1` DNF, `-2` DNS.
 */
export function formatResult(eventId: string, value: number, kind: ResultKind = "single"): string {
  if (value === 0) return "";
  if (value === -1) return "DNF";
  if (value === -2) return "DNS";

  const resultType = eventResultType(eventId);
  if (resultType === "multi") return formatMultiResult(decodeMultiResult(value));
  if (resultType === "number") return kind === "average" ? (value / 100).toFixed(2) : String(value);
  return formatCentiseconds(value);
}

/**
 * How much a PR beat the previous one, e.g. `"−0.64"` or `"−3"` moves.
 * `null` for Multi-Blind, whose encoded values can't be subtracted.
 */
export function formatImprovement(eventId: string, previous: number, value: number, kind: ResultKind = "single"): string | null {
  if (eventResultType(eventId) === "multi" || previous <= value) return null;
  return `−${formatResult(eventId, previous - value, kind)}`;
}

const isoDateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** `"2025-05-01"` → `"May 1, 2025"`. WCA dates are calendar dates, so format them in UTC. */
export function formatIsoDate(date: string): string {
  return isoDateFormat.format(new Date(`${date}T00:00:00Z`));
}

const DELEGATE_STATUS_LABELS: Record<string, string> = {
  trainee_delegate: "Trainee Delegate",
  junior_delegate: "Junior Delegate",
  delegate: "Delegate",
  regional_delegate: "Regional Delegate",
  senior_delegate: "Senior Delegate",
};

export function formatDelegateStatus(status: string): string {
  return DELEGATE_STATUS_LABELS[status]
    ?? status.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
