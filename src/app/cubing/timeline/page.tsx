import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import StatTile from "@/components/StatTile";
import PrTimeline from "@/components/results/PrTimeline";
import { timelineRows } from "@/components/results/timelineRows";
import { getResults, prStreaks, prTimeline, sortEventIds } from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "PR timeline",
  description: "Every personal record Ben Gottschalk has set at WCA competitions, in every event, newest first.",
  path: "/cubing/timeline",
});

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

export default async function TimelinePage() {
  const results = await getResults();
  const timeline = results.ok ? prTimeline(results.data, sortEventIds) : [];
  const prCount = timeline.reduce((sum, entry) => sum + entry.prs.length, 0);
  const firstYear = timeline.at(-1)?.date.slice(0, 4);
  const streaks = results.ok ? prStreaks(results.data, timeline) : null;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold">PR timeline</h1>
        <p className="mt-2 text-lg text-muted">Every personal record I&apos;ve set, in every event, newest first.</p>
      </header>

      {streaks?.longest && (
        <section aria-label="PR streaks" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile value={prCount} label={`PRs at ${plural(timeline.length, "competition")} since ${firstYear}`} />
          <StatTile
            value={streaks.current}
            label={streaks.current === 0 ? "Current PR streak (none at my latest competition)" : "Current PR streak (competitions in a row)"}
          />
          {/* Spans both columns on phones, where its date range needs the room. */}
          <div className="col-span-2 lg:col-span-1">
            <StatTile
              value={streaks.longest.length}
              label={
                <>
                  Longest PR streak:{" "}
                  {streaks.longest.length === 1
                    ? streaks.longest.from.competitionName
                    : `${streaks.longest.from.competitionName} to ${streaks.longest.to.competitionName}`}
                </>
              }
            />
          </div>
        </section>
      )}

      {results.ok ? (
        <PrTimeline rows={timelineRows(timeline)} />
      ) : (
        <div role="alert" className="alert alert-warning">Results couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      )}
    </div>
  );
}
