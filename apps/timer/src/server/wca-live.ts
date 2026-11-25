// WCA Live as the main source for a competition's schedule, each competitor's
// groups, and when their results were entered (see timer-core's competition.ts
// for how those place attempts in time). WCA Live is a separate service from
// the WCA API; its GraphQL API is public.
//
// WCA Live keeps competitions for only about three months, so the server
// captures each one into Postgres (wca_live_competition), shared by everyone:
//   while it's on      at most every 20 minutes, when a browser asks
//   after it ends      once more, a day after the last activity ("final"),
//                      then never again
//   not on WCA Live    asked again after a day, until a few days after the
//                      competition, then left to the WCIF fallback
// The daily job captures recent competitions of everyone signed in, so none
// are lost when WCA Live drops them.

import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import type { Slot, WcaLiveCapture, WcaLiveSchedule } from "@bengottschalk/timer-core/competition";
import { liveRoundKey } from "@bengottschalk/timer-core/competition";
import { endOfDay, parseInstant } from "@bengottschalk/timer-core/zone";
import type { TimerDb } from "./db";
import { wcaLiveCompetition } from "./schema";

export const WCA_LIVE_URL = process.env.NEXT_PUBLIC_WCA_LIVE_URL ?? "https://live.worldcubeassociation.org";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const TIMEOUT_MS = 20_000;
/** While a competition is on, captured again at most this often. */
export const LIVE_REFRESH_MS = 20 * MINUTE_MS;
/** A competition WCA Live didn't have is asked about again after this long. */
const MISSING_RETRY_MS = DAY_MS;
/** A day after the last activity, results have settled: the capture is final. */
const FINAL_AFTER_MS = DAY_MS;
/** WCA Live keeps about 90 days; older competitions aren't asked about. */
export const LIVE_RETENTION_DAYS = 85;

// ---------------------------------------------------------------------------
// WCA Live's answer

interface LiveActivity {
  activityCode: string;
  startTime: string;
  endTime: string;
  childActivities?: LiveActivity[];
}
const ActivitySchema: z.ZodType<LiveActivity> = z.object({
  activityCode: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  get childActivities() {
    return z.array(ActivitySchema).optional();
  },
});

const CompetitionSchema = z.object({
  data: z.object({
    competition: z.object({
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      startTime: z.string().nullable(),
      endTime: z.string().nullable(),
      venues: z.array(z.object({ timezone: z.string(), rooms: z.array(z.object({ activities: z.array(ActivitySchema) })) })),
      competitors: z.array(z.object({
        wcaId: z.string().nullable(),
        assignments: z.array(z.object({ assignmentCode: z.string(), activity: z.object({ activityCode: z.string(), startTime: z.string(), endTime: z.string() }) })),
      })),
      competitionEvents: z.array(z.object({
        event: z.object({ id: z.string() }),
        rounds: z.array(z.object({
          number: z.number(),
          results: z.array(z.object({ enteredAt: z.string().nullable(), person: z.object({ wcaId: z.string().nullable() }) })),
        })),
      })),
    }).nullable(),
  }),
});

// Everything in one request (about 75 KB for a 50-person competition).
const COMPETITION_QUERY = `query Capture($id: ID!) {
  competition(id: $id) {
    name startDate endDate startTime endTime
    venues { timezone rooms { activities {
      activityCode startTime endTime
      childActivities { activityCode startTime endTime childActivities { activityCode startTime endTime } }
    } } }
    competitors { wcaId assignments { assignmentCode activity { activityCode startTime endTime } } }
    competitionEvents { event { id } rounds { number results { enteredAt person { wcaId } } } }
  }
}`;

/** WCA Live's id for a WCA competition, or null if WCA Live doesn't have it. */
export async function findLiveCompetition(competitionId: string): Promise<string | null> {
  const response = await fetch(`${WCA_LIVE_URL}/link/competitions/${encodeURIComponent(competitionId)}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 404) return null;
  const liveId = response.headers.get("location")?.match(/\/competitions\/(\d+)/)?.[1];
  if (liveId) return liveId;
  if (response.status >= 500) throw new Error(`WCA Live returned ${response.status}`);
  return null;
}

const slot = (code: string, startTime: string, endTime: string): Slot | null => {
  const start = parseInstant(startTime);
  const end = parseInstant(endTime);
  return start === null || end === null ? null : { code, start, end };
};

/** Turns WCA Live's answer into what's kept: times as milliseconds, assignments and entry times by WCA ID. */
export function toCapture(liveId: string, competition: NonNullable<z.output<typeof CompetitionSchema>["data"]["competition"]>): WcaLiveCapture {
  const activities: Slot[] = [];
  const visit = (activity: LiveActivity) => {
    const s = slot(activity.activityCode, activity.startTime, activity.endTime);
    if (s) activities.push(s);
    activity.childActivities?.forEach(visit);
  };
  for (const venue of competition.venues) for (const room of venue.rooms) room.activities.forEach(visit);

  const schedule: WcaLiveSchedule = {
    liveId,
    name: competition.name,
    startDate: competition.startDate,
    endDate: competition.endDate,
    timeZone: competition.venues[0]?.timezone ?? null,
    start: competition.startTime ? parseInstant(competition.startTime) : null,
    end: competition.endTime ? parseInstant(competition.endTime) : null,
    roundCounts: Object.fromEntries(competition.competitionEvents.map((e) => [e.event.id, e.rounds.length])),
    activities,
  };

  const assignments: Record<string, Slot[]> = {};
  for (const person of competition.competitors) {
    if (!person.wcaId) continue;
    const groups = person.assignments
      .filter((a) => a.assignmentCode === "competitor")
      .map((a) => slot(a.activity.activityCode, a.activity.startTime, a.activity.endTime))
      .filter((s): s is Slot => s !== null);
    if (groups.length > 0) assignments[person.wcaId] = groups;
  }

  const enteredAt: Record<string, Record<string, number>> = {};
  for (const event of competition.competitionEvents) {
    for (const round of event.rounds) {
      for (const result of round.results) {
        const at = result.enteredAt ? parseInstant(result.enteredAt) : null;
        if (!result.person.wcaId || at === null) continue;
        (enteredAt[result.person.wcaId] ??= {})[liveRoundKey(event.event.id, round.number)] = at;
      }
    }
  }
  return { schedule, assignments, enteredAt };
}

/** Fetches a competition from WCA Live; null if WCA Live doesn't have it. */
export async function fetchLiveCapture(competitionId: string): Promise<WcaLiveCapture | null> {
  const liveId = await findLiveCompetition(competitionId);
  if (!liveId) return null;
  const response = await fetch(`${WCA_LIVE_URL}/api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: COMPETITION_QUERY, variables: { id: liveId } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`WCA Live returned ${response.status}`);
  const parsed = CompetitionSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("Unexpected WCA Live response");
  return parsed.data.data.competition ? toCapture(liveId, parsed.data.data.competition) : null;
}

// ---------------------------------------------------------------------------
// Stored captures

type Row = typeof wcaLiveCompetition.$inferSelect;

/** A stored row as a capture (null for "not on WCA Live"). Stored data is our own, so it's trusted as written. */
function rowCapture(row: Row): WcaLiveCapture | null {
  if (!row.liveId || !row.schedule) return null;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return { schedule: row.schedule as WcaLiveSchedule, assignments: (row.assignments ?? {}) as WcaLiveCapture["assignments"], enteredAt: (row.enteredAt ?? {}) as WcaLiveCapture["enteredAt"] };
}

/** Stored captures for some competitions (only ones WCA Live had). */
export async function storedCaptures(db: TimerDb, competitionIds: string[]): Promise<Map<string, { capture: WcaLiveCapture | null; row: Row }>> {
  const out = new Map<string, { capture: WcaLiveCapture | null; row: Row }>();
  for (let i = 0; i < competitionIds.length; i += 500) {
    for (const row of await db.select().from(wcaLiveCompetition).where(inArray(wcaLiveCompetition.competitionId, competitionIds.slice(i, i + 500)))) {
      out.set(row.competitionId, { capture: rowCapture(row), row });
    }
  }
  return out;
}

/** Whether the stored row is still good enough at `now` (so WCA Live needn't be asked). */
export function captureFresh(row: Row | undefined, now: number): boolean {
  if (!row) return false;
  if (row.final) return true;
  const age = now - row.fetchedAt.getTime();
  return row.liveId ? age < LIVE_REFRESH_MS : age < MISSING_RETRY_MS;
}

export interface CaptureOptions {
  /** The competition's last day (venue time), if known: says when "not on WCA Live" is final. */
  endDate?: string | null;
}

/**
 * A competition's WCA Live capture, from the database when fresh enough (see
 * the top of this file), otherwise fetched from WCA Live and stored. Null when
 * WCA Live doesn't have it. If WCA Live can't be reached, the stored copy is
 * used (or null).
 */
export async function liveCapture(db: TimerDb, competitionId: string, now = Date.now(), options: CaptureOptions = {}): Promise<WcaLiveCapture | null> {
  const [row] = await db.select().from(wcaLiveCompetition).where(eq(wcaLiveCompetition.competitionId, competitionId));
  if (captureFresh(row, now)) return rowCapture(row);
  let capture: WcaLiveCapture | null;
  try {
    capture = await fetchLiveCapture(competitionId);
  } catch {
    return row ? rowCapture(row) : null;
  }
  const end = capture?.schedule.end ?? null;
  const lastDay = capture?.schedule.endDate ?? options.endDate ?? null;
  const final = end !== null
    ? now > end + FINAL_AFTER_MS
    // Not on WCA Live a few days after the competition: it won't appear now.
    : lastDay !== null && now > endOfDay(lastDay, capture?.schedule.timeZone ?? null) + 3 * DAY_MS;
  const values = {
    liveId: capture?.schedule.liveId ?? null,
    schedule: capture?.schedule ?? null,
    assignments: capture?.assignments ?? null,
    enteredAt: capture?.enteredAt ?? null,
    fetchedAt: new Date(now),
    final,
  };
  await db.insert(wcaLiveCompetition).values({ competitionId, ...values })
    .onConflictDoUpdate({ target: wcaLiveCompetition.competitionId, set: values });
  return capture;
}

/** Whether a competition that started on `startDate` may still be on WCA Live. */
export const withinLiveRetention = (startDate: string, now: number) =>
  now - Date.parse(`${startDate}T00:00:00Z`) < LIVE_RETENTION_DAYS * DAY_MS;
