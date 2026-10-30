import { activityRound, assignmentLabel, formatScheduleTime, groupScheduleByDay, type ScheduleEntry } from "@/lib/wca";
import type { ScheduleDay } from "./ScheduleList";

/** Schedule entries grouped by day, with times and labels formatted here so the browser renders exactly the same text. */
export function scheduleDays(entries: ScheduleEntry[]): ScheduleDay[] {
  return groupScheduleByDay(entries).map(({ day, entries: dayEntries }) => ({
    day,
    items: dayEntries.map((entry) => ({
      key: `${entry.activityId}-${entry.assignmentCode}`,
      time: formatScheduleTime(entry),
      name: entry.name,
      label: assignmentLabel(entry.assignmentCode) + (entry.stationNumber !== null ? ` · Station ${entry.stationNumber}` : ""),
      isStaff: entry.assignmentCode !== "competitor",
      // Competing groups show my result for the round once it's entered.
      round: entry.assignmentCode === "competitor" ? activityRound(entry.activityCode) : null,
      startTime: entry.startTime,
      endTime: entry.endTime,
    })),
  }));
}
