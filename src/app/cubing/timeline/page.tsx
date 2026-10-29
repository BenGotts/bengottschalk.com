import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import StatTile from "@/components/StatTile";
import PrTimeline from "@/components/results/PrTimeline";
import { timelineRows } from "@/components/results/timelineRows";
import { competitionDateLabels, getCompetitionHistory, getResults, prDroughts, prStreaks, prTimeline, sortEventIds } from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "PR timeline",
  description: "Every personal record Ben Gottschalk has set at WCA competitions, in every event, newest first.",
  path: "/cubing/timeline",
});

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const range = (from: string, to: string) => (from === to ? from : `${from} to ${to}`);

export default async function TimelinePage() {
  // The history gives competitions' end dates, and a cached "today" for days since the last PR.
  const [results, history] = await Promise.all([getResults(), getCompetitionHistory()]);
  const timeline = results.ok ? prTimeline(results.data, sortEventIds) : [];
  const prCount = timeline.reduce((sum, entry) => sum + entry.prs.length, 0);
  const milestoneCount = timeline.reduce((sum, entry) => sum + entry.prs.filter((pr) => pr.milestone).length, 0);
  const firstYear = timeline.at(-1)?.date.slice(0, 4);
  const streaks = results.ok ? prStreaks(results.data, timeline) : null;
  const droughts = history.ok ? prDroughts(timeline, history.data.utcToday) : null;

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold">PR timeline</h1>
        <p className="mt-2 text-lg text-muted">Every personal record I&apos;ve set, in every event, newest first.</p>
      </header>

      {streaks?.longest && (
        <section aria-label="PR stats" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatTile value={prCount} label={`PRs at ${plural(timeline.length, "competition")} since ${firstYear}`} />
          <StatTile value={milestoneCount} label="Milestones: barriers broken and first Blindfolded successes" />
          <StatTile
            value={streaks.current}
            label={streaks.current === 0 ? "Current PR streak (none at my latest competition)" : "Current PR streak (competitions in a row)"}
          />
          {droughts && (
            <StatTile value={droughts.daysSinceLast.toLocaleString("en-US")} label={`Days since my last PR, at ${droughts.last.competitionName}`} />
          )}
          {/* The long ones span both columns on phones, where their ranges need the room. */}
          <div className="col-span-2 lg:col-span-1">
            <StatTile
              value={streaks.longest.length}
              label={`Longest PR streak, in competitions: ${range(streaks.longest.from.competitionName, streaks.longest.to.competitionName)}`}
            />
          </div>
          {droughts?.longest && (
            <div className="col-span-2 lg:col-span-1">
              <StatTile
                value={droughts.longest.days.toLocaleString("en-US")}
                label={`Longest PR drought, in days: ${range(droughts.longest.from.competitionName, droughts.longest.to.competitionName)}`}
              />
            </div>
          )}
        </section>
      )}

      {results.ok ? (
        <PrTimeline rows={timelineRows(timeline, competitionDateLabels(history.ok ? history.data.history : []))} />
      ) : (
        <div role="alert" className="alert alert-warning">Results couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      )}
    </div>
  );
}
