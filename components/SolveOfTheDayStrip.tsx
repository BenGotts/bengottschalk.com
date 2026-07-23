import Link from "next/link";
import { PageSection } from "@/components/layout/PageSection";
import { EVENT_NAMES } from "@/lib/wca";
import {
  SOLVE_OF_DAY_EVENTS,
  formatSolveDisplayTime,
  getSolveDetailPath,
  getTodayDatePT,
  getTodaySolvesByEvent,
  truncateScramble,
  hasReconstruction,
} from "@/lib/solves";
import type { SolveEvent, SolveOfTheDay } from "@/lib/solves";

const EVENT_ACCENTS: Record<SolveEvent, { icon: string; badge: string }> = {
  "333": {
    icon: "text-sky-400",
    badge: "text-sky-400",
  },
  sq1: {
    icon: "text-cyan-400",
    badge: "text-cyan-400",
  },
  "333bf": {
    icon: "text-emerald-400",
    badge: "text-emerald-400",
  },
};

function SolveRow({ solve, date }: { solve: SolveOfTheDay; date: string }) {
  const accent = EVENT_ACCENTS[solve.event];
  const time = formatSolveDisplayTime(solve);
  const detailHref = getSolveDetailPath(date, solve.event);

  return (
    <Link
      href={detailHref}
      className="group py-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 hover:bg-slate-900/30 -mx-4 px-4 sm:-mx-6 sm:px-6 transition-colors"
    >
      <div className="flex items-center gap-3 sm:w-40 shrink-0">
        <span className={`cubing-icon event-${solve.event} text-xl ${accent.icon}`} />
        <span className="text-sm font-bold text-white">{EVENT_NAMES[solve.event] ?? solve.event}</span>
      </div>
      <p className="flex-1 font-mono text-xs text-slate-400 leading-relaxed break-all min-w-0">
        {truncateScramble(solve.scramble, 10)}
      </p>
      <div className="flex items-center gap-4 shrink-0 sm:w-36 sm:justify-end">
        {time && <span className="font-mono text-sm font-black text-white tabular-nums">{time}s</span>}
        {hasReconstruction(solve) ? (
          <span className={`text-[10px] font-bold uppercase tracking-wider ${accent.badge}`}>
            Recon
          </span>
        ) : (
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Video</span>
        )}
        <span className="text-xs font-bold text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </span>
      </div>
    </Link>
  );
}

function EmptySolveRow({ event }: { event: SolveEvent; date: string }) {
  const accent = EVENT_ACCENTS[event];

  return (
    <div className="py-5 flex items-center gap-3 text-slate-600 -mx-4 px-4 sm:-mx-6 sm:px-6">
      <span className={`cubing-icon event-${event} text-xl ${accent.icon} opacity-30`} />
      <span className="text-sm font-medium">{EVENT_NAMES[event] ?? event}</span>
      <span className="text-xs">— not posted yet</span>
    </div>
  );
}

export function SolveOfTheDayStrip() {
  const date = getTodayDatePT();
  const solvesByEvent = getTodaySolvesByEvent();
  const hasAny = SOLVE_OF_DAY_EVENTS.some((e) => solvesByEvent[e] != null);

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <PageSection
      title="Today's Solves"
      description={formattedDate}
      actions={
        <Link href="/content" className="text-sm font-bold text-cyan-400 hover:underline">
          Browse archive →
        </Link>
      }
    >
      <div className="flex items-center gap-2 mb-4 -mt-2">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
          Solve of the Day
        </span>
      </div>

      {hasAny ? (
        <div className="divide-y divide-slate-800/70 border-t border-slate-800/70">
          {SOLVE_OF_DAY_EVENTS.map((event) => {
            const solve = solvesByEvent[event];
            return solve ? (
              <SolveRow key={event} solve={solve} date={date} />
            ) : (
              <EmptySolveRow key={event} event={event} date={date} />
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No solves posted for today yet.{" "}
          <Link href="/content" className="text-cyan-400 font-bold hover:underline">
            View past solves →
          </Link>
        </p>
      )}
    </PageSection>
  );
}
