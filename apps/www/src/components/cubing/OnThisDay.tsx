"use client";

import "@cubing/icons";
import { useSyncExternalStore } from "react";
import ExternalLink from "@/components/ExternalLink";
import CompetitionLocation from "@/components/competitions/CompetitionLocation";
import SectionHeader from "@/components/SectionHeader";
import { LuFlag } from "react-icons/lu";
import { isMilestoneCount } from "@/lib/wca/careerMilestones";
import { momentsOn, ordinal, type CubingMoment, type MomentHighlight } from "@/lib/wca/onThisDay";

const subscribe = () => () => {};
const getServer = () => null;

/**
 * Today in the viewer's own time zone, as YYYY-MM-DD. In development,
 * `?date=YYYY-MM-DD` pretends it's another day, to check dates with and without matches.
 */
function viewerToday(): string {
  if (process.env.NODE_ENV === "development") {
    const override = new URLSearchParams(window.location.search).get("date");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
  }
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, "0")).join("-");
}

const MEDAL_DOT = { gold: "bg-medal-gold", silver: "bg-medal-silver", bronze: "bg-medal-bronze" } as const;

function Highlight({ highlight }: { highlight: MomentHighlight }) {
  return (
    <li className="flex items-center gap-1.5">
      {highlight.medal
        ? <span className={`size-2.5 shrink-0 rounded-full ${MEDAL_DOT[highlight.medal]}`} aria-hidden="true" />
        : <span className={`${highlight.iconClass} shrink-0 text-muted`} aria-hidden="true" />}
      <span>
        {highlight.kind === "pr" && <span className="font-semibold text-success">{highlight.first ? "First " : "PR "}</span>}
        {highlight.label}
      </span>
      {highlight.record && <span className="badge badge-sm border-accent bg-accent/15 font-semibold">{highlight.record}</span>}
      {highlight.milestone && <span className="badge badge-sm border-primary bg-primary/15 font-semibold whitespace-nowrap">{highlight.milestone}</span>}
    </li>
  );
}

/** One career count, flagged when it's a milestone (see `isMilestoneCount`), e.g. "100th competition". */
function Count({ number, noun }: { number: number; noun: string }) {
  if (!isMilestoneCount(number)) return <span>{ordinal(number)} {noun}</span>;
  return (
    <span className="inline-flex items-center gap-1 font-semibold text-base-content">
      <LuFlag aria-hidden="true" className="size-3.5 text-primary" />
      {number === 1 ? "First" : ordinal(number)} {noun}
    </span>
  );
}

/** Where it was, and which competition it was in my career, e.g. "42nd competition · 15th as Delegate". */
function MomentDetails({ moment }: { moment: CubingMoment }) {
  const { competitionNumber, delegatedNumber } = moment;
  if (!moment.city && competitionNumber === undefined && delegatedNumber === undefined) return null;
  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
      {moment.city && moment.countryIso2 && <CompetitionLocation city={moment.city} countryIso2={moment.countryIso2} />}
      <span className="flex flex-wrap items-center gap-x-1.5">
        {competitionNumber !== undefined && <Count number={competitionNumber} noun="competition" />}
        {competitionNumber !== undefined && delegatedNumber !== undefined && <span aria-hidden="true">·</span>}
        {delegatedNumber !== undefined && <Count number={delegatedNumber} noun="as Delegate" />}
      </span>
    </span>
  );
}

/**
 * Competitions from past years on today's date, or this week's when there are
 * none today. The server can't know the viewer's date (the page is cached),
 * so the card fills in after hydration and stays hidden when nothing matches.
 */
export default function OnThisDay({ moments }: { moments: CubingMoment[] }) {
  // The snapshot is a string, so React sees the same value on every read.
  const today = useSyncExternalStore(subscribe, viewerToday, getServer);
  const day = today ? momentsOn(moments, today) : null;
  if (!day) return null;

  return (
    <section aria-labelledby="on-this-day-heading" className="space-y-4">
      <SectionHeader
        id="on-this-day-heading"
        title={day.range === "day" ? "On this day" : "This week in past years"}
        href="/cubing/competitions#past-heading"
        linkLabel="Full history"
      />
      <ol className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-200 px-5">
        {day.moments.map((moment) => (
          <li key={moment.competitionId} className="flex gap-4 py-4">
            <span className="flex shrink-0 flex-col whitespace-nowrap">
              <span className="font-display text-xl font-bold text-primary">{moment.start.slice(0, 4)}</span>
              <span className="text-xs text-muted">{moment.yearsAgo === 1 ? "1 year ago" : `${moment.yearsAgo} years ago`}</span>
            </span>
            <span className="min-w-0 flex-1 space-y-1.5">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <ExternalLink href={moment.url} className="link link-hover font-medium">{moment.competitionName}</ExternalLink>
                <span className="flex gap-1.5">
                  {moment.competed && <span className="badge badge-sm border-primary bg-primary/10">Competed</span>}
                  {moment.delegated && <span className="badge badge-sm border-secondary bg-secondary/10">Delegated</span>}
                </span>
              </span>
              <MomentDetails moment={moment} />
              {moment.highlights.length > 0 && (
                <ul className="flex flex-col gap-1 text-sm">
                  {moment.highlights.map((highlight) => <Highlight key={highlight.key} highlight={highlight} />)}
                  {moment.moreHighlights > 0 && (
                    <li className="text-muted">+{moment.moreHighlights} more {moment.moreHighlights === 1 ? "result" : "results"}</li>
                  )}
                </ul>
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
