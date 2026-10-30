"use client";

import { useNow } from "@/lib/useNow";
// Import the pure module directly: the wca index also exports server-only API code.
import { scheduleStatuses, type ScheduleStatus } from "@/lib/wca/schedule";
import { ItemBadge, useResultFor, type ScheduleItem } from "./ScheduleList";

function Row({ heading, item, status, result }: {
  heading: string;
  item: ScheduleItem;
  status: ScheduleStatus;
  result: ReturnType<ReturnType<typeof useResultFor>>;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className={`w-20 shrink-0 text-xs font-semibold uppercase tracking-wide ${status === "now" ? "text-error" : "text-muted"}`}>
        {heading}
      </span>
      <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="mr-1">
          <span className="font-mono text-sm text-muted">{item.time}</span> {item.name}
        </span>
        <ItemBadge item={item} status={status} result={result} />
      </div>
    </div>
  );
}

/**
 * The home page's glance at a live competition: what I'm doing now, what's
 * next, and my latest result. Times come from the visitor's clock, so this
 * only fills in once the page is running in the browser.
 */
export default function LiveNowNext({ items }: { items: ScheduleItem[] }) {
  const now = useNow();
  const resultFor = useResultFor();
  if (now === null) return <div className="skeleton h-24" aria-busy="true" />;

  const statuses = scheduleStatuses(items, now);
  const withStatus = items.map((item, i) => ({ item, status: statuses[i] }));
  const current = withStatus.filter(({ status }) => status === "now");
  const next = withStatus.filter(({ status }) => status === "next");
  // The most recent finished group I competed in that has a result.
  const last = withStatus.findLast(({ item, status }) => status === "done" && resultFor(item));

  if (current.length === 0 && next.length === 0 && !last) return null;

  return (
    <div className="space-y-3">
      {current.map(({ item, status }) => (
        <Row key={item.key} heading="Now" item={item} status={status} result={resultFor(item)} />
      ))}
      {next.map(({ item, status }) => (
        <Row key={item.key} heading="Up next" item={item} status={status} result={resultFor(item)} />
      ))}
      {last && <Row heading="Last result" item={last.item} status={last.status} result={resultFor(last.item)} />}
      {current.length === 0 && next.length === 0 && <p className="text-sm text-muted">All done for today.</p>}
    </div>
  );
}
