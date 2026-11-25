// What the computer and a phone used as stackmat pads say to each other.
//
// The phone does the timing: it works out each solve's time from its own touch
// timestamps and sends the finished result, so how long a message takes to
// arrive never changes a time (the computer's running clock may just show up a
// moment late). Each side repeats its state every few seconds, which doubles as
// a heartbeat: if nothing is heard for a while, the other side is gone.

import type { PadPhase } from "@bengottschalk/timer-core/pad";
import type { Penalty } from "@bengottschalk/timer-core/solve";
import type { Precision } from "@bengottschalk/timer-core/time";
import type { ColorScheme } from "@/lib/colorSchemes";

export type PadRole = "computer" | "phone";

/** The computer's state, sent to its phone whenever it changes and as a heartbeat. */
export interface ComputerState {
  t: "state";
  /** The phone this computer is paired with (another phone with the code is turned away). */
  to: string;
  eventId: string;
  eventName: string;
  inspection: boolean;
  holdMs: number;
  memoSplit: boolean;
  precision: Precision;
  /** The scramble the next solve is for (several lines for Multi-Blind). */
  scramble: string | null;
  /** For the scramble picture on the phone: the puzzle (none for Multi-Blind) and the event's colors. */
  puzzleId: string | null;
  scheme: ColorScheme;
  /** Whether a solve can start: there's a scramble and nothing on the computer is in the way. */
  canStart: boolean;
}

export type ComputerMessage =
  | ComputerState
  /** Stop inspection or a solve without saving it (Cancel or Escape on the computer). */
  | { t: "cancel"; to: string }
  /** The computer saved this result: the phone can stop resending it. */
  | { t: "ack"; to: string; id: string };

/** The phone's phase; times are how long ago things started, as of sending. */
export interface PhoneState {
  t: "phase";
  phase: PadPhase;
  inspectingForMs: number | null;
  runningForMs: number | null;
  memoMs: number | null;
}

/** A finished solve, resent until the computer acknowledges it. */
export interface PhoneResult {
  t: "result";
  id: string;
  timeMs: number;
  penalty: Penalty;
  memoMs: number | null;
  /** Wall-clock times, from the phone's clock. */
  startedAt: number;
  endedAt: number;
}

export type PhoneMessage = PhoneState | PhoneResult;

export type Envelope =
  | { from: string; role: "computer"; msg: ComputerMessage }
  | { from: string; role: "phone"; msg: PhoneMessage };

export const HEARTBEAT_MS = 2_500;
/** Nothing heard for this long: the other side is gone. */
export const GONE_AFTER_MS = 8_000;
/** How often the phone resends a result the computer hasn't acknowledged. */
export const RESEND_MS = 1_500;

// Pairing codes: no 0/O, 1/I/L, so they're easy to read off a screen and type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;

export function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** A typed code, tidied (case, spaces and dashes), or null if it can't be one. */
export function normalizeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(code) ? code : null;
}

/** A random ID for this browser, kept so a reload or reconnect is still the same device. */
export function deviceId(role: PadRole): string {
  const KEY = `pad.deviceId.${role}`;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** The page a phone opens to be the pads for the computer showing `code`. */
export const padUrl = (origin: string, code: string) => `${origin}/pad?code=${code}`;
