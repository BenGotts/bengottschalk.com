"use client";

import { Fragment, useMemo, useState } from "react";
import { LuMedal, LuTrophy } from "react-icons/lu";
import BackToTop from "@/components/BackToTop";
import ExternalLink from "@/components/ExternalLink";
import { useIncrementalList } from "@/lib/useIncrementalList";
import MiniPodium, { MEDAL_STYLES, PODIUM_ORDER } from "./MiniPodium";
import type { Badge, PodiumItem, PodiumRow } from "./podiumRows";

type Medal = PodiumItem["medal"];

// Each kind of milestone in its own style; overall milestones stand out most.
const BADGE_STYLE: Record<Badge["kind"], string> = {
  win: "bg-primary text-primary-content",
  overall: "bg-medal-gold text-black/85",
  complete: "bg-secondary/15 text-secondary",
  "first-gold": "border border-ink-gold/60 text-ink-gold",
  first: "bg-primary/15 text-primary",
  count: "bg-base-300 text-base-content",
};

// Each symbol has one meaning, on the cards, their badges and the trophy cabinet:
// a blue trophy for a competition win, a gold medal for every 50th podium, and
// a green ★ for all three placements in an event, as on the cabinet's
// nameplates. Other milestones get a subtler card and no seal.
type Highlight = "win" | "overall" | "complete" | "milestone" | "none";

// Full class names, so Tailwind finds them.
const CARD_STYLE: Record<Highlight, string> = {
  win:
    "border-2 border-primary bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-primary)_22%,var(--color-base-200)),var(--color-base-200)_75%)] shadow-[0_0_28px_-6px_var(--color-primary)]",
  overall:
    "border-2 border-ink-gold bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-medal-gold)_22%,var(--color-base-200)),var(--color-base-200)_75%)] shadow-[0_0_24px_-6px_var(--color-medal-gold)]",
  complete:
    "border-2 border-secondary/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-secondary)_14%,var(--color-base-200)),var(--color-base-200)_75%)] shadow-[0_0_20px_-8px_var(--color-secondary)]",
  milestone: "border-2 border-base-content/25 bg-base-200",
  none: "border border-base-300 bg-base-200",
};

/** The symbol for each kind of highlight, on the card's seal and in the legend. */
function Symbol({ highlight, className = "" }: { highlight: "win" | "overall" | "complete"; className?: string }) {
  if (highlight === "win") return <LuTrophy className={className} aria-hidden="true" />;
  if (highlight === "overall") return <LuMedal className={className} aria-hidden="true" />;
  return <span aria-hidden="true">★</span>;
}

const SEAL_STYLE = {
  win: "bg-primary text-primary-content",
  overall: "bg-medal-gold text-black/80",
  complete: "bg-secondary text-secondary-content",
} as const;

function highlightOf(badges: Badge[]): Highlight {
  for (const kind of ["win", "overall", "complete"] as const) {
    if (badges.some((badge) => badge.kind === kind)) return kind;
  }
  return badges.length > 0 ? "milestone" : "none";
}

/** What the seals mean, shown once above the timeline. */
function Legend() {
  const items = [
    ["win", "Won the competition"],
    ["overall", "Every 50th podium"],
    ["complete", "All three placements in an event"],
  ] as const;
  return (
    <ul aria-label="Milestone symbols" className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
      {items.map(([highlight, label]) => (
        <li key={highlight} className="flex items-center gap-1.5">
          <span className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold ${SEAL_STYLE[highlight]}`}>
            <Symbol highlight={highlight} className="size-3" />
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

/** The milestones a competition reached, as small badges in its card. */
function Badges({ badges }: { badges: Badge[] }) {
  return (
    <ul aria-label="Milestones" className="mt-2 flex flex-wrap justify-center gap-1">
      {badges.map((badge) => (
        <li key={badge.key} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4 ${BADGE_STYLE[badge.kind]}`}>
          {(badge.kind === "win" || badge.kind === "overall" || badge.kind === "complete") && <Symbol highlight={badge.kind} className="size-3" />}
          {badge.iconClass && <span className={badge.iconClass} aria-hidden="true" />}
          {badge.label}
        </li>
      ))}
    </ul>
  );
}

/** A competition's date, name and milestones, standing out when it reached one. */
function CompetitionCard({ row }: { row: PodiumRow }) {
  const highlight = highlightOf(row.badges);
  return (
    <div className={`relative mx-auto mb-3 w-fit max-w-[85%] rounded-box px-4 py-2 text-center ${CARD_STYLE[highlight]}`}>
      {(highlight === "win" || highlight === "overall" || highlight === "complete") && (
        // A seal on the corner, so the biggest milestones catch the eye while scrolling.
        <span
          aria-hidden="true"
          className={`absolute -right-2.5 -top-2.5 flex size-6 items-center justify-center rounded-full text-xs font-bold shadow ring-2 ring-base-100 ${SEAL_STYLE[highlight]}`}
        >
          <Symbol highlight={highlight} className="size-3.5" />
        </span>
      )}
      <p className="text-xs text-muted">{row.dateLabel}</p>
      <h3 className="font-semibold leading-snug">
        <ExternalLink href={`https://www.worldcubeassociation.org/competitions/${row.competitionId}`} className="link link-hover">
          {row.competitionName}
        </ExternalLink>
      </h3>
      {row.badges.length > 0 && <Badges badges={row.badges} />}
    </div>
  );
}

/**
 * Podiums down a centre line, one node per competition with its medals below,
 * newest first, filterable by one or more placements. More competitions load
 * as you scroll.
 */
export default function PodiumTimeline({ rows, pageSize = 10 }: { rows: PodiumRow[]; pageSize?: number }) {
  // The placements picked; none picked shows them all.
  const [picked, setPicked] = useState<ReadonlySet<Medal>>(new Set());
  const toggle = (medal: Medal) => setPicked((current) => {
    const next = new Set(current);
    if (!next.delete(medal)) next.add(medal);
    return next;
  });
  const counts = useMemo(() => {
    const medals = rows.flatMap((row) => row.medals);
    const count = (medal: Medal) => medals.filter((m) => m.medal === medal).length;
    return { all: medals.length, gold: count("gold"), silver: count("silver"), bronze: count("bronze") };
  }, [rows]);
  // Competitions without a podium of a picked placement drop out.
  const filtered = useMemo(
    () =>
      picked.size === 0
        ? rows
        : rows.map((row) => ({ ...row, medals: row.medals.filter((item) => picked.has(item.medal)) })).filter((row) => row.medals.length > 0),
    [rows, picked],
  );
  const shown = picked.size === 0 ? counts.all : [...picked].reduce((sum, medal) => sum + counts[medal], 0);
  const { visible, hasMore, showMore, sentinelRef } = useIncrementalList(filtered, pageSize);

  return (
    <div className="space-y-6">
      {/* A podium of the medal counts, which doubles as the filter (pick one or more steps): 2nd, 1st, 3rd, with 1st tallest. */}
      <fieldset className="mx-auto w-full max-w-sm">
        <legend className="sr-only">Show podiums by placement</legend>
        <div className="flex items-end justify-center gap-2">
          {PODIUM_ORDER.map((medal) => {
            const style = MEDAL_STYLES[medal];
            const selected = picked.has(medal);
            return (
              <button
                key={medal}
                type="button"
                aria-pressed={selected}
                aria-label={`${style.label} place: ${counts[medal]} ${counts[medal] === 1 ? "podium" : "podiums"}`}
                onClick={() => toggle(medal)}
                className={`group flex flex-1 flex-col items-center gap-1.5 transition-opacity ${picked.size === 0 || selected ? "" : "opacity-45 hover:opacity-80"}`}
              >
                <span className="font-display text-3xl font-bold">{counts[medal]}</span>
                <span
                  className={`flex w-full flex-col items-center justify-start rounded-t-box pt-2 font-display text-lg font-bold text-black/85 ring-offset-2 ring-offset-base-100 transition group-hover:brightness-110 ${style.step} ${
                    selected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {style.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t-2 border-base-300 pt-2 text-sm text-muted">
          <span aria-live="polite">{picked.size === 0 ? `${counts.all} podiums` : `${shown} of ${counts.all} podiums`}</span>
          {picked.size === 0 ? (
            <span>Tap steps to filter</span>
          ) : (
            <button type="button" onClick={() => setPicked(new Set())} className="link link-primary">Show all</button>
          )}
        </div>
      </fieldset>

      <Legend />

      <ol className="relative">
        {/* The centre line. */}
        <span className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-base-300" aria-hidden="true" />
        {visible.map((row, index) => (
          <Fragment key={row.competitionId}>
            {row.year !== visible[index - 1]?.year && (
              <li className="relative flex justify-center pb-6" aria-hidden="true">
                <span className="rounded-full bg-primary px-4 py-1 font-display text-lg font-bold text-primary-content">{row.year}</span>
              </li>
            )}
            <li className="relative pb-10">
              <CompetitionCard row={row} />
              {/* A solid background, so the centre line doesn't run through the podium. */}
              <MiniPodium medals={row.medals} competitionName={row.competitionName} className="relative mx-auto bg-base-100 px-2" />
            </li>
          </Fragment>
        ))}
      </ol>

      {hasMore && (
        <div className="flex justify-center">
          <button
            ref={(element) => { sentinelRef.current = element; }}
            type="button"
            onClick={showMore}
            className="btn btn-sm border-base-300 bg-base-200 hover:border-primary"
          >
            Show more
          </button>
        </div>
      )}

      <BackToTop />
    </div>
  );
}
