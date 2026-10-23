import { assignmentLabel, eventName, formatScheduleTime, getCompetitionSchedule, groupScheduleByDay } from "@/lib/wca";

const isStaff = (assignmentCode: string) => assignmentCode !== "competitor";

/** "Ben today": his groups and staff assignments at a competition, from its public WCIF. */
export default async function CompetitionSchedule({ competitionId, competitionName }: { competitionId: string; competitionName: string }) {
  const schedule = await getCompetitionSchedule(competitionId);
  if (!schedule.ok || !schedule.data || schedule.data.entries.length === 0) return null;

  const { entries, eventIds } = schedule.data;

  return (
    <section aria-labelledby={`schedule-${competitionId}`} className="rounded-box border border-base-300 bg-base-200 p-5">
      <h3 id={`schedule-${competitionId}`} className="text-lg font-bold">
        My schedule at {competitionName}
      </h3>
      {eventIds.length > 0 && (
        <p className="mt-1 text-sm text-muted">Competing in {eventIds.map(eventName).join(", ")}</p>
      )}
      <div className="mt-4 space-y-5">
        {groupScheduleByDay(entries).map(({ day, entries: dayEntries }) => (
          <div key={day}>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{day}</h4>
            <ol className="space-y-1.5">
              {dayEntries.map((entry) => (
                <li key={`${entry.activityId}-${entry.assignmentCode}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="w-20 shrink-0 font-mono text-sm">{formatScheduleTime(entry)}</span>
                  <span className="flex-1">{entry.name}</span>
                  <span
                    className={`badge badge-sm ${isStaff(entry.assignmentCode) ? "border-secondary bg-secondary/10" : "border-primary bg-primary/10"}`}
                  >
                    {assignmentLabel(entry.assignmentCode)}
                    {entry.stationNumber !== null && ` · Station ${entry.stationNumber}`}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
