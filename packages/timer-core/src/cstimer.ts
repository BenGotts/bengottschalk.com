// Reads a csTimer export file. The file is one JSON object: `session1`,
// `session2`, ... hold each session's solves, and `properties.sessionData`
// (a JSON string) names the sessions and their scramble types.
//
// A solve is `[[penalty, total, ...phase ends], scramble, comment, startedAt (seconds), extra?]`,
// where penalty is 0 (OK), 2000 (+2) or -1 (DNF), times are milliseconds, and
// with multi-phase timing the phase ends are cumulative, last phase first.

import type { Penalty } from "./solve";

export interface CsTimerSolve {
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  comment: string;
  /** Wall clock, milliseconds. */
  startedAt: number;
  /** Each phase's duration, first phase first, when timed in phases. */
  phasesMs: number[] | null;
}

export interface CsTimerSession {
  /** The session's number in csTimer, like 1 for `session1`. */
  index: number;
  name: string;
  /** csTimer's scramble type, like `444wca`. */
  scrambleType: string;
  /** The WCA event it most likely is, or null if it can't tell (you choose in the import screen). */
  eventId: string | null;
  rank: number;
  solves: CsTimerSolve[];
}

const SCRAMBLE_TYPES: Record<string, string> = {
  "333": "333", "333o": "333", "333oh": "333oh", "333ni": "333bf", "333fm": "333fm", "r3ni": "333mbf",
  "222so": "222", "222o": "222", "2223": "222",
  "444wca": "444", "444m": "444", "444o": "444", "444bld": "444bf",
  "555wca": "555", "555": "555", "555bld": "555bf",
  "666wca": "666", "666si": "666", "777wca": "777", "777si": "777",
  clkwca: "clock", clk: "clock",
  mgmp: "minx", mgmc: "minx", mgmo: "minx",
  pyrso: "pyram", pyrm: "pyram", pyro: "pyram",
  skbso: "skewb", skb: "skewb",
  sqrs: "sq1", sq1h: "sq1", sq1t: "sq1",
  ftoso: "fto", fto: "fto",
};

/** Session names that say what event a plain "333" session really is. */
function eventFromName(name: string): string | null {
  const n = name.toLowerCase();
  if (/\b(mbld|multi)/.test(n)) return "333mbf";
  if (/\b(oh|one.?hand)/.test(n)) return "333oh";
  if (/\b(3bld|3x3 ?bld|blind)/.test(n)) return "333bf";
  if (/\bfmc\b/.test(n)) return "333fm";
  return null;
}

function guessEvent(scrambleType: string, name: string): string | null {
  const fromType = SCRAMBLE_TYPES[scrambleType] ?? null;
  if (fromType === "333") return eventFromName(name) ?? "333";
  return fromType;
}

function readPenalty(value: unknown): Penalty {
  if (value === -1) return "dnf";
  if (value === 2000) return "+2";
  return "none";
}

function readSolve(entry: unknown): CsTimerSolve | null {
  if (!Array.isArray(entry) || !Array.isArray(entry[0])) return null;
  const times = entry[0] as unknown[];
  const [penalty, total] = times;
  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return null;
  const startedSeconds = typeof entry[3] === "number" ? entry[3] : 0;

  let phasesMs: number[] | null = null;
  const ends = times.slice(1).filter((value): value is number => typeof value === "number");
  if (ends.length > 1) {
    const ascending = ends.toReversed();
    phasesMs = ascending.map((end, i) => end - (i === 0 ? 0 : ascending[i - 1]));
  }

  return {
    timeMs: Math.round(total),
    penalty: readPenalty(penalty),
    scramble: typeof entry[1] === "string" ? entry[1] : "",
    comment: typeof entry[2] === "string" ? entry[2] : "",
    startedAt: startedSeconds * 1000,
    phasesMs,
  };
}

interface SessionInfo {
  name?: unknown;
  rank?: unknown;
  opt?: { scrType?: unknown };
}

/** Reads a csTimer export (the file's text). Throws if it isn't one. */
export function parseCsTimerExport(text: string): CsTimerSession[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a csTimer export (it isn't JSON).");
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error("That file isn't a csTimer export.");
  }
  const record = data as Record<string, unknown>;

  let info: Record<string, SessionInfo> = {};
  const properties = record.properties as { sessionData?: unknown } | undefined;
  const rawInfo = properties?.sessionData;
  try {
    const parsed = typeof rawInfo === "string" ? JSON.parse(rawInfo) : rawInfo;
    if (parsed && typeof parsed === "object") info = parsed as Record<string, SessionInfo>;
  } catch {
    // Unnamed sessions are still imported.
  }

  const sessions: CsTimerSession[] = [];
  for (const [key, value] of Object.entries(record)) {
    const match = /^session(\d+)$/.exec(key);
    if (!match || !Array.isArray(value)) continue;
    const index = Number(match[1]);
    const meta = info[String(index)] ?? {};
    const name = meta.name === undefined || meta.name === null ? String(index) : String(meta.name);
    const scrambleType = typeof meta.opt?.scrType === "string" ? meta.opt.scrType : "333";
    const solves = value.map(readSolve).filter((solve): solve is CsTimerSolve => solve !== null);
    sessions.push({
      index,
      name,
      scrambleType,
      eventId: guessEvent(scrambleType, name),
      rank: typeof meta.rank === "number" ? meta.rank : index,
      solves,
    });
  }
  if (sessions.length === 0) throw new Error("No csTimer sessions were found in that file.");
  return sessions.toSorted((a, b) => a.rank - b.rank || a.index - b.index);
}
