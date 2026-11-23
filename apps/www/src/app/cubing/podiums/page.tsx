import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import PodiumGoal from "@/components/results/PodiumGoal";
import PodiumStatTiles from "@/components/results/PodiumStatTiles";
import PodiumTimeline from "@/components/results/PodiumTimeline";
import { podiumRows } from "@/components/results/podiumRows";
import { competitionDateLabels, getCompetitionHistory, getMainEvents, getResults, podiumGoal, podiums, podiumStats } from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "Podiums",
  description: "Every WCA podium Ben Gottschalk has stood on, and his progress toward 1st, 2nd and 3rd place in every official event.",
  path: "/cubing/podiums",
});

export default async function PodiumsPage() {
  const [results, history] = await Promise.all([getResults(), getCompetitionHistory()]);
  // Results only carry start dates; the history has each competition's end date.
  const dateLabel = competitionDateLabels(history.ok ? history.data.history : []);

  const header = (
    <header>
      <h1 className="text-4xl font-bold">Podiums</h1>
      <p className="mt-2 text-lg text-muted">My top-three finishes in WCA finals, and my goal of placing 1st, 2nd and 3rd in every official event.</p>
    </header>
  );

  if (!results.ok) {
    return (
      <div className="space-y-6">
        {header}
        <div role="alert" className="alert alert-warning">Podiums couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      </div>
    );
  }

  const podiumList = podiums(results.data);
  // Main events decide competition wins.
  const mainEvents = await getMainEvents(podiumList);
  return (
    <div className="space-y-12">
      {header}
      <PodiumGoal goal={podiumGoal(podiumList)} dateLabel={dateLabel} />
      {podiumList.length > 0 && (
        <>
          <section aria-labelledby="podium-stats-heading" className="space-y-4">
            <h2 id="podium-stats-heading" className="scroll-mt-24 text-2xl font-bold">By the numbers</h2>
            <PodiumStatTiles stats={podiumStats(results.data)} dateLabel={dateLabel} />
          </section>
          <section aria-labelledby="podium-timeline-heading" className="space-y-6">
            {/* The placement filter in the timeline shows the medal counts. */}
            <h2 id="podium-timeline-heading" className="scroll-mt-24 text-2xl font-bold">Every podium</h2>
            <PodiumTimeline rows={podiumRows(podiumList, dateLabel, mainEvents)} />
          </section>
        </>
      )}
    </div>
  );
}
