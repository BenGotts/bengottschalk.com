import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import PrTimeline from "@/components/results/PrTimeline";
import { getResults, prTimeline, sortEventIds } from "@/lib/wca";

export const metadata: Metadata = pageMetadata({
  title: "PR timeline",
  description: "Every personal record Ben Gottschalk has set at WCA competitions, in every event, newest first.",
  path: "/cubing/timeline",
});

export default async function TimelinePage() {
  const results = await getResults();
  const timeline = results.ok ? prTimeline(results.data, sortEventIds) : [];
  const prCount = timeline.reduce((sum, entry) => sum + entry.prs.length, 0);
  const firstYear = timeline.at(-1)?.date.slice(0, 4);

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-bold">PR timeline</h1>
        <p className="mt-2 text-lg text-muted">Every personal record I&apos;ve set, in every event, newest first.</p>
        {timeline.length > 0 && (
          <p className="mt-1 text-sm text-muted">
            {prCount} PRs at {timeline.length} competitions since {firstYear}
          </p>
        )}
      </header>

      {results.ok ? (
        <PrTimeline entries={timeline} />
      ) : (
        <div role="alert" className="alert alert-warning">Results couldn&apos;t be loaded from the WCA right now. Please try again later.</div>
      )}
    </div>
  );
}
