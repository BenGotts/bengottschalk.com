import StatTile from "@/components/StatTile";
import type { CubingStats as Stats } from "@/lib/wca";

/** Gold, silver and bronze counts: in a row, or one per line with `stacked`. */
export function MedalCounts({ medals, stacked = false }: { medals: Stats["medals"]; stacked?: boolean }) {
  return (
    <span className={stacked ? "flex flex-col gap-0.5" : "flex flex-wrap gap-x-3 gap-y-1"}>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-gold" aria-hidden="true" />{medals.gold} gold</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-silver" aria-hidden="true" />{medals.silver} silver</span>
      <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-medal-bronze" aria-hidden="true" />{medals.bronze} bronze</span>
    </span>
  );
}

/**
 * The headline stat tiles, the same on the home page and the Cubing pages.
 * Each links to the competitions, podiums or records behind its number.
 */
export default function CubingStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatTile value={stats.competed} label="Competed in" tone="blue" href="/cubing/competitions?role=competed#past-heading" />
      <StatTile value={stats.delegated} label="Delegated" tone="green" href="/cubing/competitions?role=delegated#past-heading" />
      <StatTile
        value={stats.medals.total}
        tone="yellow"
        label={<MedalCounts medals={stats.medals} stacked />}
        href={stats.medals.total > 0 ? "/cubing/results#podiums-heading" : undefined}
      />
      <StatTile
        value={stats.records.total}
        tone="red"
        label={stats.records.total === 1 ? "Regional record" : "Regional records"}
        href={stats.records.total > 0 ? "/cubing/results#records-heading" : undefined}
      />
    </div>
  );
}
