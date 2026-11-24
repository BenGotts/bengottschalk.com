"use client";

import type { SessionStats } from "@bengottschalk/timer-core/stats";
import type { EventFormat } from "@bengottschalk/timer-core/events";
import type { Precision } from "@bengottschalk/timer-core/time";
import { formatMean, formatValue } from "@/lib/format";

interface Props {
  eventId: string;
  format: EventFormat;
  stats: SessionStats;
  precision: Precision;
}

export default function StatsPanel({ eventId, format, stats, precision }: Props) {
  // Mean-of-3 events lead with mo3; the rest lead with ao5.
  const averages = stats.averages.filter((a) => (format === "mo3" ? true : a.label !== "mo3") && (a.spec.size <= 12 || stats.count >= a.spec.size));

  return (
    <div className="rounded-box bg-base-200 p-3 text-sm">
      <div className="mb-2 flex justify-between text-muted">
        <span>{stats.count} {stats.count === 1 ? "solve" : "solves"}{stats.count !== stats.solved && ` · ${stats.count - stats.solved} DNF`}</span>
        <span>mean <span className="timer-digits text-base-content">{formatMean(eventId, stats.mean, precision)}</span></span>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="font-normal" scope="col"><span className="sr-only">Stat</span></th>
            <th className="font-normal" scope="col">current</th>
            <th className="font-normal" scope="col">best</th>
          </tr>
        </thead>
        <tbody className="timer-digits">
          <tr>
            <th scope="row" className="py-0.5 text-left font-normal text-muted">single</th>
            <td>{formatValue(eventId, stats.last, precision)}</td>
            <td>{formatValue(eventId, stats.best, precision)}</td>
          </tr>
          {format !== "best" && averages.map((average) => (
            <tr key={average.label}>
              <th scope="row" className="py-0.5 text-left font-normal text-muted">{average.label}</th>
              <td>{formatMean(eventId, average.current, precision)}</td>
              <td>{formatMean(eventId, average.best, precision)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
