import "@cubing/icons";
import Link from "next/link";
import { LuChevronRight } from "react-icons/lu";
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

function PrValue({ eventId, label, rank, kind }: { eventId: string; label: string; rank?: Rank; kind: "single" | "average" }) {
  if (!rank) return <span />;
  return (
    <span>
      <span className="block text-xs text-muted">{label}</span>
      <span className="block font-mono text-lg font-medium">{formatResult(eventId, rank.best, kind)}</span>
      <span className="block text-xs text-muted">
        NR {rank.country_rank.toLocaleString("en-US")} · WR {rank.world_rank.toLocaleString("en-US")}
      </span>
    </span>
  );
}

/**
 * Personal records for every event, with national, continental and world ranks:
 * a stacked list on phones and a full table from tablet width up.
 */
export default function PrTable({ records }: { records: Person["personal_records"] }) {
  const eventIds = sortEventIds(Object.keys(records));
  return (
    <>
      <ul className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200 md:hidden">
        {eventIds.map((eventId) => (
          <li key={eventId}>
            <Link href={`/cubing/results/${eventId}`} className="flex flex-col gap-2 px-4 py-3 hover:bg-base-300/50">
              <span className="flex items-center gap-2 font-medium">
                <span className={`${eventIconClass(eventId)} text-lg`} aria-hidden="true" />
                {eventName(eventId)}
                <LuChevronRight className="ml-auto text-muted" aria-hidden="true" />
              </span>
              <span className="grid grid-cols-2 gap-3">
                <PrValue eventId={eventId} label="Single" rank={records[eventId].single} kind="single" />
                <PrValue eventId={eventId} label="Average" rank={records[eventId].average} kind="average" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-box border border-base-300 bg-base-200 md:block">
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
          {eventIds.map((eventId) => {
            const { single, average } = records[eventId];
            return (
              <tr key={eventId} className="hover:bg-base-300/50">
                <th scope="row" className="font-medium">
                  <Link href={`/cubing/results/${eventId}`} className="link link-hover inline-flex items-center gap-2 whitespace-nowrap">
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
    </>
  );
}
