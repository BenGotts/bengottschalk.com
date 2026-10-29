import "@cubing/icons";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import EventSwitcher from "@/components/results/EventSwitcher";
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
  sortEventIds,
  type PrPoint,
  type Rank,
} from "@/lib/wca";

export async function generateStaticParams() {
  const person = await getPerson();
  const events = person.ok ? Object.keys(person.data.personal_records) : [];
  // Cache Components needs at least one param; 333 is the safe fallback.
  return (events.length > 0 ? events : ["333"]).map((event) => ({ event }));
}

export async function generateMetadata({ params }: PageProps<"/cubing/results/[event]">): Promise<Metadata> {
  const { event } = await params;
  return pageMetadata({
    title: `${eventName(event)} results`,
    description: `Ben Gottschalk's ${eventName(event)} personal records, WCA rankings, and PR history.`,
    path: `/cubing/results/${event}`,
  });
}

function PrCard({ label, value, rank, setAt }: { label: string; value: string; rank: Rank; setAt?: PrPoint }) {
  return (
    <div className="flex flex-col gap-4 rounded-box border border-base-300 bg-base-200 p-5">
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="font-mono text-4xl font-medium">{value}</p>
        {setAt && (
          <p className="mt-1 text-sm text-muted">
            {setAt.competitionName} · {formatIsoDate(setAt.date)}
          </p>
        )}
      </div>
      <dl className="grid grid-cols-3 gap-2 border-t border-base-300 pt-4 text-center">
        {[
          ["National", rank.country_rank],
          ["Continental", rank.continent_rank],
          ["World", rank.world_rank],
        ].map(([name, count]) => (
          <div key={name}>
            <dt className="text-xs text-muted">{name}</dt>
            <dd className="font-semibold">{count.toLocaleString("en-US")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PrHistory({ title, points, eventId, kind }: { title: string; points: PrPoint[]; eventId: string; kind: "single" | "average" }) {
  if (points.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <ol className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200">
        {points.toReversed().map((point) => (
          <li key={`${point.competitionId}-${point.value}`} className="flex items-baseline gap-4 px-4 py-2.5">
            <span className="w-20 shrink-0 font-mono font-medium sm:w-24">{formatResult(eventId, point.value, kind)}</span>
            {/* The date sits under the name on phones and in its own column from sm up. */}
            <span className="min-w-0 flex-1">
              {point.competitionName}
              <span className="block text-sm text-muted sm:hidden">{formatIsoDate(point.date)}</span>
            </span>
            <span className="hidden shrink-0 text-sm text-muted sm:block">{formatIsoDate(point.date)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Same shape as the page, shown only for event URLs that weren't prerendered.
function EventResultsSkeleton() {
  return (
    <div className="space-y-10">
      <div className="skeleton h-8 w-full rounded-box" />
      <div className="skeleton h-14 w-72 rounded-box" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="skeleton h-48 rounded-box" />
        <div className="skeleton h-48 rounded-box" />
      </div>
      <div className="skeleton h-80 rounded-box" />
    </div>
  );
}

// `params` is awaited inside <Suspense> so navigation stays instant (Partial
// Prefetching streams this route's shell first). Unknown events still render
// the not-found page; because streaming has started, the status stays 200 and
// Next adds `noindex`.
export default function EventResultsPage({ params }: PageProps<"/cubing/results/[event]">) {
  return (
    <Suspense fallback={<EventResultsSkeleton />}>
      <EventResults params={params} />
    </Suspense>
  );
}

async function EventResults({ params }: Pick<PageProps<"/cubing/results/[event]">, "params">) {
  const { event } = await params;
  if (!isKnownEvent(event)) notFound();

  const [person, results] = await Promise.all([getPerson(), getResults(event)]);
  const pr = person.ok ? person.data.personal_records[event] : undefined;
  if (person.ok && !pr) notFound();

  const progression = results.ok ? prProgression(results.data) : null;
  const eventIds = person.ok ? sortEventIds(Object.keys(person.data.personal_records)) : [];
  const index = eventIds.indexOf(event);
  const previous = index > 0 ? eventIds[index - 1] : undefined;
  const next = index !== -1 && index < eventIds.length - 1 ? eventIds[index + 1] : undefined;

  return (
    <div className="space-y-10">
      <header className="space-y-6">
        {eventIds.length > 1 && <EventSwitcher key={event} eventIds={eventIds} current={event} />}
        <h1 className="flex items-center gap-3 text-4xl font-bold">
          <span className={eventIconClass(event)} aria-hidden="true" />
          {eventName(event)}
        </h1>
      </header>

      {pr && (
        <section aria-label="Personal records" className="grid gap-4 sm:grid-cols-2">
          <PrCard label="Single" value={formatResult(event, pr.single.best)} rank={pr.single} setAt={progression?.single.at(-1)} />
          {pr.average && (
            <PrCard label="Average" value={formatResult(event, pr.average.best, "average")} rank={pr.average} setAt={progression?.average.at(-1)} />
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

      {(previous || next) && (
        <nav aria-label="Other events" className="flex justify-between gap-4 border-t border-base-300 pt-6">
          {previous ? (
            <Link href={`/cubing/results/${previous}`} className="group flex items-center gap-3">
              <LuArrowLeft className="text-muted transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              <span>
                <span className="block text-xs text-muted">Previous</span>
                <span className="flex items-center gap-2 font-medium group-hover:text-primary">
                  <span className={eventIconClass(previous)} aria-hidden="true" />
                  {eventName(previous)}
                </span>
              </span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/cubing/results/${next}`} className="group flex items-center gap-3 text-right">
              <span>
                <span className="block text-xs text-muted">Next</span>
                <span className="flex items-center justify-end gap-2 font-medium group-hover:text-primary">
                  <span className={eventIconClass(next)} aria-hidden="true" />
                  {eventName(next)}
                </span>
              </span>
              <LuArrowRight className="text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
