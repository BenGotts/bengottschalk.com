import { LuFocus, LuX } from "react-icons/lu";
import ExternalLink from "@/components/ExternalLink";
// Import the pure module directly: the wca index also exports server-only API code.
import type { MapCompetition, MapLocation } from "@/lib/wca/competitions";

const monthDay = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const day = (date: string) => monthDay.format(new Date(`${date}T00:00:00Z`));

/** Dates within a year, which the list already shows: "May 1", "May 1 – 3" or "Apr 30 – May 2". */
function shortRange(start: string, end: string): string {
  if (end <= start) return day(start);
  return start.slice(0, 7) === end.slice(0, 7) ? `${day(start)} – ${Number(end.slice(8))}` : `${day(start)} – ${day(end)}`;
}

function Badge({ competition }: { competition: MapCompetition }) {
  if (competition.status === "ongoing") return <span className="badge badge-sm shrink-0 border-error bg-error/15">Now</span>;
  if (competition.status === "upcoming") return <span className="badge badge-sm shrink-0 border-dashed border-secondary">Upcoming</span>;
  if (competition.delegatedOnly) return <span className="badge badge-sm shrink-0 border-primary/60 bg-primary/10">Delegated</span>;
  return null;
}

/**
 * A pin's competitions, over the map: a card on the left on computers and a
 * sheet along the bottom on phones. Every competition is listed, by year.
 */
export default function MapLocationCard({ location, onClose, onZoom }: { location: MapLocation; onClose: () => void; onZoom: () => void }) {
  // Competitions are newest first, so the years come out newest first too.
  const years = new Map<string, MapCompetition[]>();
  for (const competition of location.competitions) {
    const year = competition.startDate.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), competition]);
  }
  const yearList = [...years.keys()];
  const span = yearList.length > 1 ? `${yearList.at(-1)}–${yearList[0]}` : yearList[0];
  const count = location.competitions.length;

  return (
    <section
      aria-label={`Competitions in ${location.city}`}
      className="absolute inset-x-2 bottom-7 z-[1000] flex max-h-[60%] flex-col rounded-box border border-base-300 bg-base-200 shadow-lg sm:inset-x-auto sm:top-3 sm:bottom-auto sm:left-3 sm:max-h-[calc(100%-2.5rem)] sm:w-80"
    >
      <header className="flex items-start gap-2 border-b border-base-300 p-3 pb-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold leading-snug">{location.city}</h3>
          <p className="text-xs text-muted">
            {count} {count === 1 ? "competition" : "competitions"} · {span}
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm btn-square" onClick={onZoom} aria-label="Zoom in here" title="Zoom in here">
          <LuFocus className="size-4" aria-hidden="true" />
        </button>
        <button type="button" className="btn btn-ghost btn-sm btn-square -mr-1" onClick={onClose} aria-label="Close" title="Close">
          <LuX className="size-4" aria-hidden="true" />
        </button>
      </header>
      {/* `relative` keeps each link's hidden "(opens in a new tab)" text inside the scrolling list. */}
      <div className="relative overflow-y-auto overscroll-contain px-3 pb-2">
        {[...years].map(([year, competitions]) => (
          <section key={year} aria-label={year}>
            <h4 className="sticky top-0 bg-base-200 pt-2.5 pb-1 text-xs font-semibold tracking-wider text-muted">{year}</h4>
            <ul className="space-y-1.5">
              {competitions.map((competition) => (
                <li key={competition.id} className="flex items-baseline gap-2 text-sm">
                  <span className="w-[4.75rem] shrink-0 text-xs text-muted tabular-nums">{shortRange(competition.startDate, competition.endDate)}</span>
                  <ExternalLink href={competition.url} className="link link-hover min-w-0 flex-1 leading-snug">
                    {competition.name}
                  </ExternalLink>
                  <Badge competition={competition} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
