import "@cubing/icons";
import Link from "next/link";
import { eventIconClass, eventName, type PodiumGoal as Goal, type PodiumGoalCell } from "@/lib/wca";
import { MEDAL_STYLES } from "./MiniPodium";

const FILL = { gold: "bg-medal-gold", silver: "bg-medal-silver", bronze: "bg-medal-bronze" } as const;

export type DateLabel = (competitionId: string, startDate: string) => string;

const times = (count: number) => (count === 1 ? "once" : `${count} times`);

function describe(cell: PodiumGoalCell, event: string, dateLabel: DateLabel): string {
  const place = `${MEDAL_STYLES[cell.medal].label} in ${event}`;
  if (!cell.first) return `${place}: not yet`;
  return `${place}: ${times(cell.count)}, first at ${cell.first.competitionName}, ${dateLabel(cell.first.competitionId, cell.first.startDate)}`;
}

/**
 * One placement in one event: filled in its medal color once done, with how
 * many times and since when; an empty slot until then. Used in the goal grid
 * and on each event's page.
 */
export function PlacementSlot({ cell, event, dateLabel, className = "h-11" }: { cell: PodiumGoalCell; event: string; dateLabel: DateLabel; className?: string }) {
  const label = describe(cell, event, dateLabel);
  return cell.first ? (
    <span title={label} className={`flex flex-col items-center justify-center rounded-field leading-tight text-black/80 ${FILL[cell.medal]} ${className}`}>
      <span aria-hidden="true" className="font-display text-base font-bold">×{cell.count}</span>
      <span aria-hidden="true" className="text-[10px] font-medium">{cell.first.startDate.slice(0, 4)}</span>
      <span className="sr-only">{label}</span>
    </span>
  ) : (
    <span title={label} className={`flex items-center justify-center rounded-field border border-dashed border-base-content/25 text-xs text-muted/70 ${className}`}>
      <span aria-hidden="true">{MEDAL_STYLES[cell.medal].label}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * The goal of placing 1st, 2nd and 3rd in every current event: overall
 * progress, then a row per event with each placement filled in once done.
 */
export default function PodiumGoal({ goal, dateLabel }: { goal: Goal; dateLabel: DateLabel }) {
  const { rows, done, total, completeEvents } = goal;
  return (
    <section aria-labelledby="podium-goal-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="podium-goal-heading" className="scroll-mt-24 text-xl font-bold">Every podium in every event</h2>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-display text-4xl font-bold text-secondary">{done}</span>
          <span className="font-display text-xl font-semibold text-muted"> / {total}</span>
          <span className="block text-sm text-muted">placements: 1st, 2nd and 3rd in each of {rows.length} events</span>
        </p>
        <p className="text-sm text-muted">
          <span className="font-medium text-base-content">{completeEvents}</span> {completeEvents === 1 ? "event" : "events"} with all three
        </p>
      </div>
      <progress className="progress progress-secondary w-full" value={done} max={total} aria-label="Podium placements done" />

      <table className="w-full table-fixed border-separate border-spacing-0">
        <caption className="sr-only">Podium placements by event</caption>
        <colgroup>
          <col />
          <col className="w-14 sm:w-20" />
          <col className="w-14 sm:w-20" />
          <col className="w-14 sm:w-20" />
        </colgroup>
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="pb-1 text-left font-medium">Event</th>
            {(["gold", "silver", "bronze"] as const).map((medal) => (
              <th key={medal} scope="col" className="pb-1 font-medium">{MEDAL_STYLES[medal].label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const event = eventName(row.eventId);
            return (
              <tr key={row.eventId}>
                <th scope="row" className="py-0.5 pr-2 text-left font-normal">
                  <Link href={`/cubing/results/${row.eventId}`} className="flex min-w-0 items-center gap-2 hover:text-primary">
                    <span className={`${eventIconClass(row.eventId)} shrink-0 text-xl`} aria-hidden="true" />
                    <span className="leading-tight">{event}</span>
                    {row.complete && (
                      <span className="shrink-0 text-secondary" title="All three placements">
                        <span aria-hidden="true">✓</span>
                        <span className="sr-only">, all three placements</span>
                      </span>
                    )}
                  </Link>
                </th>
                {row.cells.map((cell) => (
                  <td key={cell.medal} className="p-0.5"><PlacementSlot cell={cell} event={event} dateLabel={dateLabel} /></td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
