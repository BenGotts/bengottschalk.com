// Times are stored as whole milliseconds, exactly as timed, typed or read
// from a Stackmat. Precision only changes how they are shown.

export type Precision = "hundredths" | "thousandths";

const TEN_MINUTES = 600_000;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, "0");
}

/** Whole milliseconds as `s.cc`, `m:ss.cc` or `h:mm:ss.cc`, from an already-rounded value. */
function layout(ms: number, precision: Precision, showFraction = true): string {
  const fractionDigits = precision === "thousandths" ? 3 : 2;
  const unit = precision === "thousandths" ? 1 : 10;
  const fraction = Math.floor((ms % 1000) / unit);
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const tail = showFraction ? `.${pad(fraction, fractionDigits)}` : "";
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}${tail}`;
  if (minutes > 0) return `${minutes}:${pad(seconds)}${tail}`;
  return `${seconds}${tail}`;
}

/**
 * A single, the WCA way: cut off (not rounded) to the shown precision, so
 * 12.349 shows as 12.34. Times of ten minutes or more round to the second.
 */
export function formatTime(ms: number, precision: Precision = "hundredths"): string {
  if (!Number.isFinite(ms)) return "DNF";
  if (ms >= TEN_MINUTES) return layout(Math.round(ms / 1000) * 1000, precision, false);
  return layout(Math.max(0, Math.floor(ms)), precision);
}

/**
 * An average or mean, the WCA way: rounded to the shown precision. Averages
 * of ten minutes or more round to the second.
 */
export function formatAverage(ms: number, precision: Precision = "hundredths"): string {
  if (!Number.isFinite(ms)) return "DNF";
  if (ms >= TEN_MINUTES) return layout(Math.round(ms / 1000) * 1000, precision, false);
  const unit = precision === "thousandths" ? 1 : 10;
  return layout(Math.round(ms / unit) * unit, precision);
}

/** A running time on the display: hundredths or thousandths, never rounded up. */
export function formatRunning(ms: number, precision: Precision = "hundredths"): string {
  return layout(Math.max(0, Math.floor(ms)), precision);
}

export interface ParsedTime {
  ms: number;
  penalty: "none" | "+2" | "dnf";
}

/**
 * Reads a typed time. Accepts `12.345`, `1:02.3`, `1:02:03.45`, or digits
 * alone the way csTimer reads them (`1234` → 12.34, `12345` → 1:23.45; with
 * thousandths on, the last three digits are the fraction). A trailing `+` or
 * `+2` adds two seconds; `DNF` anywhere marks it DNF (`DNF` alone is a DNF
 * with no time). Nothing is rounded.
 */
export function parseTime(input: string, precision: Precision = "hundredths"): ParsedTime | null {
  let text = input.trim().toLowerCase().replaceAll(/\s+/g, "");
  if (text === "") return null;

  let penalty: ParsedTime["penalty"] = "none";
  if (text.includes("dnf")) {
    penalty = "dnf";
    text = text.replaceAll("dnf", "").replaceAll(/[()]/g, "");
    if (text === "") return { ms: 0, penalty };
  } else if (/\+2?$/.test(text)) {
    penalty = "+2";
    text = text.replace(/\+2?$/, "");
  }

  if (/^\d+$/.test(text)) {
    const fractionDigits = precision === "thousandths" ? 3 : 2;
    const digits = text.padStart(fractionDigits + 1, "0");
    const fraction = Number(digits.slice(-fractionDigits)) * (precision === "thousandths" ? 1 : 10);
    const rest = digits.slice(0, -fractionDigits);
    const seconds = Number(rest.slice(-2));
    const minutes = Number(rest.slice(0, -2) || "0");
    if (seconds >= 60 && rest.length > 2) return null;
    return { ms: (minutes * 60 + seconds) * 1000 + fraction, penalty };
  }

  const match = /^(?:(?:(\d+):)?(\d+):)?(\d+)(?:\.(\d{1,3}))?$/.exec(text);
  if (!match) return null;
  const [, h, m, s, fractionText = ""] = match;
  const hours = Number(h ?? 0);
  const minutes = Number(m ?? 0);
  const seconds = Number(s);
  if ((m !== undefined && seconds >= 60) || (h !== undefined && minutes >= 60)) return null;
  const fraction = Number(fractionText.padEnd(3, "0"));
  return { ms: ((hours * 60 + minutes) * 60 + seconds) * 1000 + fraction, penalty };
}
