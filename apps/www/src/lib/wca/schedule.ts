import { parseActivityCode } from "@wca/helpers";
import { eventName } from "./events";
import type { Wcif, WcifActivity } from "./schemas";

export interface ScheduleEntry {
  activityId: number;
  activityCode: string;
  name: string;
  assignmentCode: string;
  stationNumber: number | null;
  startTime: string;
  endTime: string;
  roomName: string;
  timezone: string;
}

export interface PersonSchedule {
  roles: string[];
  eventIds: string[];
  entries: ScheduleEntry[];
}

/**
 * Readable name for a WCIF activity code, e.g. `333-r1-g2` →
 * `3x3x3 Cube, Round 1, Group 2`. An event's last round is `Final`, as on WCA
 * Live, when `roundCounts` (rounds per event) is given. Non-event activities
 * (`other-lunch`) use the name from the schedule.
 */
export function activityName(activityCode: string, scheduleName: string, roundCounts?: Map<string, number>): string {
  if (activityCode.startsWith("other-")) return scheduleName;
  try {
    const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activityCode);
    const parts = [eventName(eventId)];
    if (roundNumber) parts.push(roundNumber === roundCounts?.get(eventId) ? "Final" : `Round ${roundNumber}`);
    if (groupNumber) parts.push(`Group ${groupNumber}`);
    if (attemptNumber) parts.push(`Attempt ${attemptNumber}`);
    return parts.join(", ");
  } catch {
    return scheduleName;
  }
}

/** `333-r1-g5` → `{ eventId: "333", roundNumber: 1 }`; `null` for non-event activities. */
export function activityRound(activityCode: string): { eventId: string; roundNumber: number } | null {
  if (activityCode.startsWith("other-")) return null;
  try {
    const { eventId, roundNumber } = parseActivityCode(activityCode);
    return roundNumber ? { eventId, roundNumber } : null;
  } catch {
    return null;
  }
}

interface LocatedActivity {
  activity: WcifActivity;
  roomName: string;
  timezone: string;
}

function indexActivities(wcif: Wcif): Map<number, LocatedActivity> {
  const index = new Map<number, LocatedActivity>();
  const visit = (activity: WcifActivity, roomName: string, timezone: string) => {
    index.set(activity.id, { activity, roomName, timezone });
    for (const child of activity.childActivities) visit(child, roomName, timezone);
  };
  for (const venue of wcif.schedule.venues) {
    for (const room of venue.rooms) {
      for (const activity of room.activities) visit(activity, room.name, venue.timezone);
    }
  }
  return index;
}

const ASSIGNMENT_LABELS: Record<string, string> = {
  competitor: "Competing",
  "staff-judge": "Judging",
  "staff-scrambler": "Scrambling",
  "staff-runner": "Running",
  "staff-dataentry": "Data entry",
  "staff-announcer": "Announcing",
  "staff-delegate": "Delegating",
};

/** `staff-judge` → `Judging`; unknown codes become `Staff: other-code`-style labels. */
export function assignmentLabel(assignmentCode: string): string {
  const known = ASSIGNMENT_LABELS[assignmentCode];
  if (known) return known;
  const words = assignmentCode.replace(/^staff-/, "").split(/[-_]/).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Groups entries by local day at the venue, e.g. `"Saturday, Oct 24"`. */
export function groupScheduleByDay(entries: ScheduleEntry[]): { day: string; entries: ScheduleEntry[] }[] {
  const groups = new Map<string, ScheduleEntry[]>();
  for (const entry of entries) {
    const day = new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "short", day: "numeric", timeZone: entry.timezone,
    }).format(new Date(entry.startTime));
    groups.set(day, [...(groups.get(day) ?? []), entry]);
  }
  return [...groups.entries()].map(([day, dayEntries]) => ({ day, entries: dayEntries }));
}

/** `"9:00 AM"` in the venue's timezone. */
export function formatScheduleTime(entry: Pick<ScheduleEntry, "startTime" | "timezone">): string {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: entry.timezone })
    .format(new Date(entry.startTime));
}

export type ScheduleStatus = "done" | "now" | "next" | null;

/**
 * Where each entry stands at `now` (ms since epoch): finished, happening, the
 * next to start (several if they start together), or later (`null`).
 */
export function scheduleStatuses(entries: Pick<ScheduleEntry, "startTime" | "endTime">[], now: number): ScheduleStatus[] {
  const starts = entries.map((entry) => Date.parse(entry.startTime));
  const ends = entries.map((entry) => Date.parse(entry.endTime));
  const upcomingStarts = starts.filter((start) => start > now);
  const nextStart = upcomingStarts.length > 0 ? Math.min(...upcomingStarts) : null;
  return entries.map((_, i) => {
    if (ends[i] <= now) return "done";
    if (starts[i] <= now) return "now";
    return starts[i] === nextStart ? "next" : null;
  });
}

/** One person's roles, events and assignments at a competition, sorted by time. */
export function getPersonSchedule(wcif: Wcif, wcaId: string): PersonSchedule | null {
  const person = wcif.persons.find((p) => p.wcaId === wcaId);
  if (!person) return null;

  const activities = indexActivities(wcif);
  const roundCounts = new Map((wcif.events ?? []).map((event) => [event.id, event.rounds.length]));
  const entries: ScheduleEntry[] = [];
  for (const assignment of person.assignments ?? []) {
    const located = activities.get(assignment.activityId);
    if (!located) continue;
    entries.push({
      activityId: assignment.activityId,
      activityCode: located.activity.activityCode,
      name: activityName(located.activity.activityCode, located.activity.name, roundCounts),
      assignmentCode: assignment.assignmentCode,
      stationNumber: assignment.stationNumber,
      startTime: located.activity.startTime,
      endTime: located.activity.endTime,
      roomName: located.roomName,
      timezone: located.timezone,
    });
  }

  return {
    roles: person.roles ?? [],
    eventIds: person.registration?.status === "accepted" ? person.registration.eventIds : [],
    entries: entries.toSorted(
      (a, b) => Date.parse(a.startTime) - Date.parse(b.startTime) || a.name.localeCompare(b.name),
    ),
  };
}
