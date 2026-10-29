import "@cubing/icons";
import Link from "next/link";
import { eventIconClass, eventName, formatResult, type Person } from "@/lib/wca";

/** One event's single and average PRs with their world ranks, linking to the event page. */
export default function PrCard({ eventId, record }: { eventId: string; record: Person["personal_records"][string] }) {
  const { single, average } = record;
  return (
    <Link
      href={`/cubing/results/${eventId}`}
      className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-200 p-5 transition-colors hover:border-primary focus-visible:border-primary"
    >
      <span className="flex items-center gap-2 font-semibold">
        <span className={`${eventIconClass(eventId)} text-xl`} aria-hidden="true" />
        {eventName(eventId)}
      </span>
      <span className="grid grid-cols-2 gap-3">
        <span>
          <span className="block text-xs text-muted">Single</span>
          <span className="block font-mono text-2xl font-medium">{formatResult(eventId, single.best)}</span>
          <span className="block text-xs text-muted">WR {single.world_rank.toLocaleString("en-US")}</span>
        </span>
        {average && (
          <span>
            <span className="block text-xs text-muted">Average</span>
            <span className="block font-mono text-2xl font-medium">{formatResult(eventId, average.best, "average")}</span>
            <span className="block text-xs text-muted">WR {average.world_rank.toLocaleString("en-US")}</span>
          </span>
        )}
      </span>
    </Link>
  );
}
