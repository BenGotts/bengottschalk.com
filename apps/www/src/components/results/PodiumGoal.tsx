import "@cubing/icons";
import { type PodiumGoal as Goal, type PodiumGoalCell } from "@/lib/wca";
import { MEDAL_STYLES } from "./MiniPodium";
import TrophyCabinet from "./TrophyCabinet";

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
 * progress, then the trophy cabinet with a shelf per event.
 */
export default function PodiumGoal({ goal, dateLabel }: { goal: Goal; dateLabel: DateLabel }) {
  const { rows, done, total, completeEvents } = goal;
  return (
    <section aria-labelledby="podium-goal-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="podium-goal-heading" className="scroll-mt-24 text-xl font-bold">Trophy cabinet</h2>
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

      <TrophyCabinet rows={rows} dateLabel={dateLabel} />
      <p className="text-sm text-muted">Tap a medal for when and where. Each empty hook is a placement still to win; a ★ marks an event with all three.</p>
    </section>
  );
}
