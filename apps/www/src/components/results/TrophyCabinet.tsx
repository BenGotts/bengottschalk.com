import "@cubing/icons";
import Link from "next/link";
import type { CSSProperties } from "react";
import { eventIconClass, eventName, type Medal, type PodiumGoalRow, type PodiumGoalCell } from "@/lib/wca";
import { MEDAL_STYLES } from "./MiniPodium";
import type { DateLabel } from "./PodiumGoal";

// The cabinet is an object on the page, so it keeps its wood and velvet in
// both themes; the medals use the site's medal colors.
const WOOD = "bg-[linear-gradient(180deg,#7a4e26,#4a2d14)]";
const PLANK = "bg-[linear-gradient(180deg,#9a6a38,#5e3a1a)]";
const BRASS = "bg-[linear-gradient(180deg,#e9cd7a,#b08a35)] text-[#2b1d07]";
// Retired events get a pewter plate, so they read as kept for the record.
const PEWTER = "bg-[linear-gradient(180deg,#d4d8de,#8e959f)] text-[#1c2026]";

const DISC: Record<Medal, string> = {
  gold: "var(--color-medal-gold)",
  silver: "var(--color-medal-silver)",
  bronze: "var(--color-medal-bronze)",
};
const NUMBER: Record<Medal, string> = { gold: "1", silver: "2", bronze: "3" };

/** A medal on its ribbon: a V of ribbon above a disc engraved with the placement. */
function MedalArt({ medal, className = "", style }: { medal: Medal; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 56" className={className} style={style} aria-hidden="true">
      <path d="M8 0h9l7 22h-9z" fill="#b3262f" />
      <path d="M23 0h9l-7 22h-9z" fill="#8f1d25" />
      <path d="M11 0h3l7 22h-3z M26 0h3l-7 22h-3z" fill="#f3efe6" opacity="0.85" />
      <circle cx="20" cy="38" r="15" fill={DISC[medal]} />
      <circle cx="20" cy="38" r="11.5" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="1.5" />
      <path d="M9 31a13 13 0 0 1 12-8" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <text x="20" y="43.5" textAnchor="middle" fontSize="15" fontWeight="800" fill="#000" fillOpacity="0.5">{NUMBER[medal]}</text>
    </svg>
  );
}

/** An empty hook: the outline of a medal still to win. */
function EmptyHook({ medal }: { medal: Medal }) {
  return (
    <svg viewBox="0 0 40 56" className="h-16 w-12 sm:h-[4.5rem] sm:w-[3.25rem]" aria-hidden="true">
      <path d="M20 2v6a4 4 0 1 1-4 4" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="38" r="14" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="20" y="43" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fillOpacity="0.22">{NUMBER[medal]}</text>
    </svg>
  );
}

function PopoverLine({ label, at, dateLabel }: { label: string; at: NonNullable<PodiumGoalCell["first"]>; dateLabel: DateLabel }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{at.competitionName}<span className="block text-xs text-muted">{dateLabel(at.competitionId, at.startDate)}</span></dd>
    </div>
  );
}

/**
 * One placement on a shelf. Won: the medal (fanned into a stack for repeats)
 * with its count, opening a popover with the first and latest. Not yet: an empty hook.
 */
function Hook({ cell, eventId, retired, dateLabel }: { cell: PodiumGoalCell; eventId: string; retired: boolean; dateLabel: DateLabel }) {
  const place = MEDAL_STYLES[cell.medal].label;
  const event = eventName(eventId);
  if (!cell.first || !cell.latest) {
    const label = `${place} in ${event}: ${retired ? "never won, and the event is retired" : "not yet"}`;
    return (
      <div className={`flex flex-col items-center ${retired ? "opacity-50" : ""}`} title={label}>
        <EmptyHook medal={cell.medal} />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const id = `medal-${eventId}-${cell.medal}`;
  const behind = Math.min(cell.count - 1, 2);
  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        className="group relative flex flex-col items-center rounded-field outline-offset-4 transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
        aria-label={`${place} in ${event}: ${cell.count === 1 ? "once" : `${cell.count} times`}. Show when and where.`}
      >
        <span className="relative h-16 w-12 sm:h-[4.5rem] sm:w-[3.25rem]">
          {/* Repeats fan out behind the front medal, up to two more. */}
          {Array.from({ length: behind }, (_, i) => (
            <MedalArt
              key={i}
              medal={cell.medal}
              className="absolute inset-0 size-full brightness-75"
              style={{ transform: `translateX(${(behind - i) * 5}px) rotate(${(behind - i) * 6}deg)`, transformOrigin: "50% 0" }}
            />
          ))}
          <MedalArt medal={cell.medal} className="absolute inset-0 size-full drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)] transition-transform group-hover:rotate-[-4deg]" />
        </span>
        {cell.count > 1 && (
          <span className="absolute -right-2 top-0 rounded-full bg-black/70 px-1.5 font-display text-[11px] font-bold leading-5 text-white ring-1 ring-white/25">
            ×{cell.count}
          </span>
        )}
      </button>
      <div
        id={id}
        popover="auto"
        className="m-auto w-[min(20rem,calc(100vw-2rem))] rounded-box border border-base-300 bg-base-100 p-5 text-base-content shadow-2xl backdrop:bg-black/40"
      >
        <div className="flex items-center gap-3">
          <MedalArt medal={cell.medal} className="h-14 w-10 shrink-0" />
          <div>
            <p className="font-bold">{MEDAL_STYLES[cell.medal].place} place</p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <span className={eventIconClass(eventId)} aria-hidden="true" />
              {event}
            </p>
          </div>
          <p className="ml-auto font-display text-3xl font-bold">×{cell.count}</p>
        </div>
        <dl className="mt-4 space-y-2 border-t border-base-300 pt-3 text-sm">
          <PopoverLine label="First" at={cell.first} dateLabel={dateLabel} />
          {cell.count > 1 && <PopoverLine label="Latest" at={cell.latest} dateLabel={dateLabel} />}
        </dl>
        {/* Retired events have no results page. */}
        {retired ? (
          <p className="mt-4 text-sm text-muted">{event} is retired, so this placement is kept for the record.</p>
        ) : (
          <Link href={`/cubing/results/${eventId}`} className="link link-hover mt-4 block text-sm text-primary">
            {event} results →
          </Link>
        )}
      </div>
    </>
  );
}

/**
 * One event's compartment: its three hooks standing on a shelf, with the
 * event's nameplate mounted on the shelf's front edge, so the name belongs to
 * the medals above it.
 */
function Shelf({ row, retired = false, dateLabel }: { row: PodiumGoalRow; retired?: boolean; dateLabel: DateLabel }) {
  const name = eventName(row.eventId);
  return (
    <li aria-label={`${name}${retired ? " (retired)" : ""}`} className="flex flex-col overflow-hidden rounded-md bg-white/[0.04] ring-1 ring-white/10">
      <div className="flex flex-1 items-end justify-around px-2 pt-3">
        {row.cells.map((cell) => <Hook key={cell.medal} cell={cell} eventId={row.eventId} retired={retired} dateLabel={dateLabel} />)}
      </div>
      <div className={`flex h-8 items-center justify-center px-2 ${PLANK} shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-3px_4px_rgba(0,0,0,0.35)]`}>
        <span className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-[3px] px-2 py-0.5 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.5)] ${retired ? PEWTER : BRASS}`}>
          <span className={`${eventIconClass(row.eventId)} shrink-0`} aria-hidden="true" />
          <span className="truncate">{name}</span>
          {retired && <span className="shrink-0 font-normal opacity-75">· retired</span>}
          {row.complete && (
            <>
              <span className="shrink-0" aria-hidden="true">★</span>
              <span className="sr-only">, all three placements</span>
            </>
          )}
        </span>
      </div>
    </li>
  );
}

const GRID = "relative grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3";

/**
 * The podium goal as a trophy cabinet: a compartment per current event, holding
 * the 1st, 2nd and 3rd place medals won there and an empty hook for each still
 * to win. Retired events with podiums sit on their own shelves below, outside the goal.
 */
export default function TrophyCabinet({ rows, retired, dateLabel }: { rows: PodiumGoalRow[]; retired: PodiumGoalRow[]; dateLabel: DateLabel }) {
  return (
    <div className={`rounded-box p-2 shadow-xl sm:p-3 ${WOOD}`}>
      <div className="relative overflow-hidden rounded-[calc(var(--radius-box)-0.25rem)] bg-[radial-gradient(ellipse_at_top,#1d2c4d,#0b1324_70%)] p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.7)] sm:p-5">
        {/* Glare across the glass. */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.05)_42%,transparent_50%)]" aria-hidden="true" />
        <ul aria-label="Current events" className={GRID}>
          {rows.map((row) => <Shelf key={row.eventId} row={row} dateLabel={dateLabel} />)}
        </ul>
        {retired.length > 0 && (
          <section aria-labelledby="retired-shelf-heading" className="relative mt-6 space-y-4">
            <h3 id="retired-shelf-heading" className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
              Retired events
              <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
            </h3>
            <ul aria-label="Retired events" className={GRID}>
              {retired.map((row) => <Shelf key={row.eventId} row={row} retired dateLabel={dateLabel} />)}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
