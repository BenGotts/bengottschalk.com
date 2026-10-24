"use client";

import { useEffect, useRef } from "react";
import { LuCircle, LuCircleCheck } from "react-icons/lu";
import { useNow } from "@/lib/useNow";
// Import the pure module directly: the wca index also exports server-only API code.
import { liveResultSummary, type LiveResult } from "@/lib/wca/live";
import { scheduleStatuses, type ScheduleStatus } from "@/lib/wca/schedule";
import { useLiveResults } from "./LiveResultsProvider";

export interface ScheduleItem {
  key: string;
  /** Pre-formatted on the server, e.g. "10:04 AM" in the venue's time zone. */
  time: string;
  name: string;
  label: string;
  isStaff: boolean;
  /** The event round, for competing groups. */
  round: { eventId: string; roundNumber: number } | null;
  startTime: string;
  endTime: string;
}

export interface ScheduleDay {
  day: string;
  items: ScheduleItem[];
}

/** Timeline marker: a check once a group is over, a pulsing dot while it's on. */
function StatusIcon({ status }: { status: ScheduleStatus | undefined }) {
  if (status === "done") return <LuCircleCheck className="text-success" aria-label="Done" />;
  if (status === "now") return <span className="status status-error animate-pulse" aria-hidden="true" />;
  return <LuCircle className="text-base-content/30" aria-hidden="true" />;
}

/**
 * The schedule, with "Now" and "Up next" badges from the visitor's clock.
 * Pages are prebuilt, so the server can't know the current time; the badges
 * only appear in the browser.
 */
export default function ScheduleList({ days }: { days: ScheduleDay[] }) {
  const now = useNow();
  const { results } = useLiveResults();
  const resultFor = ({ round }: ScheduleItem): LiveResult | undefined =>
    round
      ? results?.find((r) => r.round.competitionEvent.event.id === round.eventId && r.round.number === round.roundNumber && r.attempts.length > 0)
      : undefined;
  const items = days.flatMap((day) => day.items);
  const statuses = now === null ? null : scheduleStatuses(items, now);
  const statusOf = new Map(items.map((item, i) => [item.key, statuses?.[i] ?? null]));

  // Scroll to what's happening, with finished groups just above it. Only when
  // the current group changes, so it doesn't fight someone scrolling.
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentKey = items.find((item) => statusOf.get(item.key) === "now")?.key
    ?? items.find((item) => statusOf.get(item.key) === "next")?.key;
  useEffect(() => {
    const container = scrollRef.current;
    const row = currentKey ? container?.querySelector<HTMLElement>(`[data-key="${CSS.escape(currentKey)}"]`) : null;
    if (container && row) container.scrollTop = row.offsetTop - container.clientHeight / 3;
  }, [currentKey]);

  return (
    <div
      ref={scrollRef}
      className="relative -mx-2 mt-4 max-h-96 space-y-5 overflow-y-auto overscroll-contain px-2 pb-1"
    >
      {days.map(({ day, items: dayItems }) => (
        <div key={day}>
          {/* Stays visible while scrolling through a day. */}
          <h4 className="sticky top-0 z-10 mb-2 bg-base-200 py-1 text-sm font-semibold uppercase tracking-wide text-muted">{day}</h4>
          <ol className="space-y-1.5">
            {dayItems.map((item) => {
              const status = statusOf.get(item.key);
              const result = resultFor(item);
              return (
                <li
                  key={item.key}
                  data-key={item.key}
                  className={`flex items-baseline gap-3 rounded-field px-2 py-1 -mx-2 ${
                    status === "now" ? "bg-error/10" : status === "done" ? "text-muted" : ""
                  }`}
                >
                  {/* Pinned to the first line when a row wraps on phones. */}
                  <span className="flex h-6 w-4 shrink-0 items-center justify-center self-start">
                    <StatusIcon status={status} />
                  </span>
                  <span className="w-20 shrink-0 font-mono text-sm">{item.time}</span>
                  {/* On phones the badges wrap under the name instead of under the time. */}
                  <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="w-full sm:mr-1 sm:w-auto sm:flex-1">{item.name}</span>
                    {status === "now" && (
                      <span className="badge badge-sm border-error bg-error/10 font-semibold">Now</span>
                    )}
                    {status === "next" && <span className="badge badge-sm border-accent bg-accent/10 font-semibold">Up next</span>}
                    {result ? (
                      // Once my attempts are in, the result replaces "Competing"; green when advancing.
                      <span
                        className={`badge badge-sm font-mono ${
                          result.advancing ? "border-success bg-success/10 text-success" : "border-base-content/30 bg-transparent text-base-content"
                        }`}
                      >
                        {liveResultSummary(result)}
                        {result.advancing && <span className="sr-only"> (advancing)</span>}
                      </span>
                    ) : (
                      <span
                        className={`badge badge-sm ${
                          status === "done"
                            ? "border-base-300 bg-transparent"
                            : item.isStaff ? "border-secondary bg-secondary/10" : "border-primary bg-primary/10"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
