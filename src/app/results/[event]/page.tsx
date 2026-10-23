import "@cubing/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import ProgressionChart from "@/components/results/ProgressionChart";
import {
  eventIconClass,
  eventName,
  eventResultType,
  formatIsoDate,
  formatResult,
  getPerson,
  getResults,
  isKnownEvent,
  prProgression,
  type PrPoint,
  type Rank,
} from "@/lib/wca";

export async function generateStaticParams() {
  const person = await getPerson();
  const events = person.ok ? Object.keys(person.data.personal_records) : [];
  // Cache Components needs at least one param; 333 is the safe fallback.
  return (events.length > 0 ? events : ["333"]).map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps<"/results/[event]">): Promise<Metadata> {
  const { event } = await params;
  return {
    title: `${eventName(event)} results | bengottschalk.com`,
    description: `Benjamin Gottschalk's ${eventName(event)} personal records and PR history.`,
  };
}


const rankLine = (rank: Rank) => `NR ${rank.country_rank} · CR ${rank.continent_rank} · WR ${rank.world_rank}`;

function PrHistory({ title, points, eventId, kind }: { title: string; points: PrPoint[]; eventId: string; kind: "single" | "average" }) {
  if (points.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <ol className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200">
        {points.toReversed().map((point) => (
          <li key={`${point.competitionId}-${point.value}`} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5">
            <span className="w-24 font-mono font-medium">{formatResult(eventId, point.value, kind)}</span>
            <span className="min-w-0 flex-1">{point.competitionName}</span>
            <span className="text-sm text-muted">{formatIsoDate(point.date)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Params are checked before anything renders so unknown events get a real 404,
// not a 200 with not-found content streamed into the static shell.
export default async function EventResultsPage({ params }: PageProps<"/results/[event]">) {
  const { event } = await params;
  if (!isKnownEvent(event)) notFound();

  const [person, results] = await Promise.all([getPerson(), getResults(event)]);
  const pr = person.ok ? person.data.personal_records[event] : undefined;
  if (person.ok && !pr) notFound();

  const progression = results.ok ? prProgression(results.data) : null;

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link href="/results" className="link link-hover inline-flex items-center gap-1.5 text-sm text-muted">
          <LuArrowLeft aria-hidden="true" /> All results
        </Link>
        <h1 className="flex items-center gap-3 text-4xl font-bold">
          <span className={eventIconClass(event)} aria-hidden="true" />
          {eventName(event)}
        </h1>
      </header>

      {pr && (
        <section aria-label="Personal records" className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-box border border-base-300 bg-base-200 p-5">
            <p className="text-sm text-muted">Single</p>
            <p className="font-mono text-4xl font-medium">{formatResult(event, pr.single.best)}</p>
            <p className="mt-1 text-sm text-muted">{rankLine(pr.single)}</p>
          </div>
          {pr.average && (
            <div className="rounded-box border border-base-300 bg-base-200 p-5">
              <p className="text-sm text-muted">Average</p>
              <p className="font-mono text-4xl font-medium">{formatResult(event, pr.average.best, "average")}</p>
              <p className="mt-1 text-sm text-muted">{rankLine(pr.average)}</p>
            </div>
          )}
        </section>
      )}

      {progression ? (
        <>
          {eventResultType(event) !== "multi" && (
            <section aria-labelledby="chart-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
              <h2 id="chart-heading" className="text-xl font-bold">PR progression</h2>
              <ProgressionChart eventId={event} progression={progression} />
            </section>
          )}
          <div className="grid gap-8 lg:grid-cols-2">
            <PrHistory title="Single PR history" points={progression.single} eventId={event} kind="single" />
            <PrHistory title="Average PR history" points={progression.average} eventId={event} kind="average" />
          </div>
        </>
      ) : (
        <div role="alert" className="alert alert-warning">Result history couldn&apos;t be loaded from the WCA right now.</div>
      )}
    </div>
  );
}
