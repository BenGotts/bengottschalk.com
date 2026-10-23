import "@cubing/icons";
import Link from "next/link";
import { eventIconClass, eventName, formatResult, sortEventIds, type Person, type Rank } from "@/lib/wca";

function RankCells({ rank }: { rank?: Rank }) {
  if (!rank) return <><td className="text-muted">–</td><td className="text-muted">–</td><td className="text-muted">–</td></>;
  return (
    <>
      <td className="text-muted">{rank.country_rank}</td>
      <td className="text-muted">{rank.continent_rank}</td>
      <td className="text-muted">{rank.world_rank}</td>
    </>
  );
}

/** Personal records for every event, with national, continental and world ranks. */
export default function PrTable({ records }: { records: Person["personal_records"] }) {
  return (
    <div className="overflow-x-auto rounded-box border border-base-300 bg-base-200">
      <table className="table">
        <thead>
          <tr className="text-muted">
            <th scope="col">Event</th>
            <th scope="col">Single</th>
            <th scope="col"><abbr title="National rank">NR</abbr></th>
            <th scope="col"><abbr title="Continental rank">CR</abbr></th>
            <th scope="col"><abbr title="World rank">WR</abbr></th>
            <th scope="col">Average</th>
            <th scope="col"><abbr title="National rank">NR</abbr></th>
            <th scope="col"><abbr title="Continental rank">CR</abbr></th>
            <th scope="col"><abbr title="World rank">WR</abbr></th>
          </tr>
        </thead>
        <tbody>
          {sortEventIds(Object.keys(records)).map((eventId) => {
            const { single, average } = records[eventId];
            return (
              <tr key={eventId} className="hover:bg-base-300/50">
                <th scope="row" className="font-medium">
                  <Link href={`/results/${eventId}`} className="link link-hover inline-flex items-center gap-2 whitespace-nowrap">
                    <span className={`${eventIconClass(eventId)} text-lg`} aria-hidden="true" />
                    {eventName(eventId)}
                  </Link>
                </th>
                <td className="font-mono whitespace-nowrap">{formatResult(eventId, single.best)}</td>
                <RankCells rank={single} />
                <td className="font-mono whitespace-nowrap">{average ? formatResult(eventId, average.best, "average") : ""}</td>
                <RankCells rank={average} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
