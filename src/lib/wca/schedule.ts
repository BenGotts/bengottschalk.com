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
 * `3x3x3 Cube, Round 1, Group 2`. Non-event activities (`other-lunch`) use the
 * name from the schedule.
 */
export function activityName(activityCode: string, scheduleName: string): string {
  if (activityCode.startsWith("other-")) return scheduleName;
  try {
    const { eventId, roundNumber, groupNumber, attemptNumber } = parseActivityCode(activityCode);
    const parts = [eventName(eventId)];
    if (roundNumber) parts.push(`Round ${roundNumber}`);
    if (groupNumber) parts.push(`Group ${groupNumber}`);
    if (attemptNumber) parts.push(`Attempt ${attemptNumber}`);
    return parts.join(", ");
  } catch {
    return scheduleName;
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

/** One person's roles, events and assignments at a competition, sorted by time. */
export function getPersonSchedule(wcif: Wcif, wcaId: string): PersonSchedule | null {
  const person = wcif.persons.find((p) => p.wcaId === wcaId);
  if (!person) return null;

  const activities = indexActivities(wcif);
  const entries: ScheduleEntry[] = [];
  for (const assignment of person.assignments ?? []) {
    const located = activities.get(assignment.activityId);
    if (!located) continue;
    entries.push({
      activityId: assignment.activityId,
      activityCode: located.activity.activityCode,
      name: activityName(located.activity.activityCode, located.activity.name),
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
