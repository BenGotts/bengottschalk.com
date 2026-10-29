import StatTile from "@/components/StatTile";
import { EARTH_CIRCUMFERENCE_MILES, HOME, type TravelStats as Stats } from "@/lib/wca";

/** A distance for a stat tile, with a smaller unit so it fits a half-width tile on phones. */
export function Miles({ miles }: { miles: number }) {
  return (
    <span className="whitespace-nowrap">
      {Math.round(miles).toLocaleString("en-US")}
      <span className="text-xl font-semibold"> mi</span>
    </span>
  );
}

/** Distance travelled between competitions, the farthest one, the busiest year and the most-visited city. */
export default function TravelStats({ stats }: { stats: Stats }) {
  const laps = stats.totalMiles / EARTH_CIRCUMFERENCE_MILES;
  return (
    <section aria-labelledby="travel-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="travel-heading" className="scroll-mt-24 text-2xl font-bold">Travel</h2>
        <p className="text-sm text-muted">
          Straight-line distances between {stats.competitions} competitions in date order, leaving out multi-location ones.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            value={<Miles miles={stats.totalMiles} />}
            label={
              laps >= 0.1
                ? `Travelled from competition to competition, about ${laps.toFixed(1)}× around the Earth`
                : "Travelled from competition to competition"
            }
          />
        </div>
        {stats.farthest && (
          <div className="col-span-2 lg:col-span-1">
            <StatTile
              value={<Miles miles={stats.farthest.miles} />}
              label={`Farthest from ${HOME.name}: ${stats.farthest.entry.name}`}
            />
          </div>
        )}
        {stats.busiestYear && (
          <StatTile value={stats.busiestYear.year} label={`Busiest year, with ${stats.busiestYear.count} competitions`} />
        )}
        {stats.topCity && (
          <StatTile
            value={stats.topCity.count}
            label={`Competitions in ${stats.topCity.city}, my most-visited city`}
          />
        )}
      </div>
    </section>
  );
}
