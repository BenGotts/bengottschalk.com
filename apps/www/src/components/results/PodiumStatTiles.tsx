import "@cubing/icons";
import StatTile from "@/components/StatTile";
import { eventIconClass, eventName, type PodiumStats } from "@/lib/wca";
import type { DateLabel } from "./PodiumGoal";

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** An event's name with its icon, kept together on one line. */
function EventName({ eventId }: { eventId: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className={`${eventIconClass(eventId)} mr-1 align-[-0.125em]`} aria-hidden="true" />
      {eventName(eventId)}
    </span>
  );
}

/** Podium numbers beyond the medal counts: where and when. */
export default function PodiumStatTiles({ stats, dateLabel }: { stats: PodiumStats; dateLabel: DateLabel }) {
  const { events, topEvent, bestCompetition, bestYear, firstPodium, currentStreak } = stats;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      <StatTile tone="blue" value={events} label={events === 1 ? "Event with a podium" : "Different events with a podium"} />
      <StatTile tone="red" value={currentStreak} label={currentStreak === 1 ? "Competition in a row with a podium" : "Competitions in a row with a podium"} />
      {topEvent && (
        <StatTile tone="green" value={topEvent.count} label={<>Podiums in <EventName eventId={topEvent.eventId} />, my most in one event</>} />
      )}
      {bestCompetition && (
        <StatTile
          tone="yellow"
          value={bestCompetition.count}
          label={`Podiums at ${bestCompetition.name}, my most at one competition (${dateLabel(bestCompetition.id, bestCompetition.startDate)})`}
        />
      )}
      {bestYear && (
        <StatTile tone="orange" value={bestYear.year} label={`My best year, with ${plural(bestYear.count, "podium")} in ${plural(bestYear.events, "event")}`} />
      )}
      {firstPodium && (
        <StatTile
          tone="blue"
          value={firstPodium.result.competition_start_date.slice(0, 4)}
          label={<>First podium: <EventName eventId={firstPodium.result.event_id} /> at {firstPodium.result.competition_short_name}</>}
        />
      )}
    </div>
  );
}
