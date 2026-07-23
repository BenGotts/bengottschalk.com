import { PageSection } from "@/components/layout/PageSection";
import { PNW_CUBING_LINKS, PNW_CUBING_URL } from "@/lib/pnw-cubing";

export function PnwCubingHub() {
  return (
    <PageSection
      title="Pacific Northwest Cubing"
      description={
        <>
          The hub for PNW competitions, delegates, and community resources. This site is my personal
          brand —{" "}
          <a
            href={PNW_CUBING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline font-semibold"
          >
            pnwcubing.com
          </a>{" "}
          is where to find everything happening across the region.
        </>
      }
      actions={
        <a
          href={PNW_CUBING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-bold text-emerald-400 hover:underline"
        >
          Visit pnwcubing.com →
        </a>
      }
    >
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
        {PNW_CUBING_LINKS.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {label} ↗
          </a>
        ))}
      </nav>
    </PageSection>
  );
}
