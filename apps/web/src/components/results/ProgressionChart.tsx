import { eventResultType, formatResult, type PrPoint, type Progression } from "@/lib/wca";

// Phones get their own drawing at about their real size, so the labels stay
// readable instead of shrinking with a wide chart.
const LAYOUTS = {
  wide: { width: 720, height: 300, pad: { left: 64, right: 20, top: 16, bottom: 32 }, maxYears: 8, dot: 4, stroke: 2.5 },
  narrow: { width: 320, height: 240, pad: { left: 58, right: 8, top: 12, bottom: 28 }, maxYears: 4, dot: 3.5, stroke: 2 },
};
type Layout = (typeof LAYOUTS)["wide"];
const DAY_MS = 86_400_000;

/** Round axis ticks (steps of 1, 2 or 5 × 10ⁿ) that cover [min, max] in about four steps. */
export function niceTicks(min: number, max: number): number[] {
  const range = max - min || Math.abs(max) * 0.2 || 1;
  const rough = range / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? 10 * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks = [start];
  while (ticks.at(-1)! < max) ticks.push(ticks.at(-1)! + step);
  if (ticks.length < 2) ticks.push(start + step);
  return ticks;
}

interface Series {
  key: "single" | "average";
  label: string;
  points: PrPoint[];
  lineClass: string;
  dotClass: string;
}

/**
 * Step chart of PR history. Faster results sit lower, so the line steps down
 * as PRs improve. FMC averages (moves × 100) are plotted in moves to share the
 * axis with singles. Not used for Multi-Blind, whose values aren't linear.
 */
export default function ProgressionChart({ eventId, progression, dateLabel }: {
  eventId: string;
  progression: Progression;
  /** Formats a competition's dates by id (see `competitionDateLabels`). */
  dateLabel: (competitionId: string, startDate: string) => string;
}) {
  const isMoves = eventResultType(eventId) === "number";
  const plotValue = (point: PrPoint, key: Series["key"]) => (isMoves && key === "average" ? point.value / 100 : point.value);

  const series: Series[] = [
    { key: "single" as const, label: "Single", points: progression.single, lineClass: "stroke-primary", dotClass: "fill-primary" },
    { key: "average" as const, label: "Average", points: progression.average, lineClass: "stroke-secondary", dotClass: "fill-secondary" },
  ].filter((s) => s.points.length > 0);
  if (series.length === 0) return null;

  const times = series.flatMap((s) => s.points.map((p) => Date.parse(p.date)));
  const values = series.flatMap((s) => s.points.map((p) => plotValue(p, s.key)));
  let [tMin, tMax] = [Math.min(...times), Math.max(...times)];
  if (tMax - tMin < 60 * DAY_MS) [tMin, tMax] = [tMin - 30 * DAY_MS, tMax + 30 * DAY_MS];
  const yTicks = niceTicks(Math.min(...values), Math.max(...values));
  const [vMin, vMax] = [yTicks[0], yTicks.at(-1)!];

  const tickLabel = (v: number) => (isMoves ? v.toFixed(1).replace(/\.0$/, "") : formatResult(eventId, Math.round(v)));

  const plot = (layout: Layout, className: string) => {
    const { width, height, pad } = layout;
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const x = (t: number) => pad.left + ((t - tMin) / (tMax - tMin)) * plotW;
    const y = (v: number) => pad.top + ((vMax - v) / (vMax - vMin)) * plotH;

    const firstYear = new Date(tMin).getUTCFullYear() + 1;
    const lastYear = new Date(tMax).getUTCFullYear();
    const yearStep = Math.max(1, Math.ceil((lastYear - firstYear + 1) / layout.maxYears));
    const years: number[] = [];
    for (let year = firstYear; year <= lastYear; year += yearStep) years.push(year);

    const path = (s: Series) =>
      s.points
        .map((p, i) => {
          const px = x(Date.parse(p.date)).toFixed(1);
          const py = y(plotValue(p, s.key)).toFixed(1);
          return i === 0 ? `M${px} ${py}` : `H${px} V${py}`;
        })
        .join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className={`w-full ${className}`} aria-hidden="true">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={pad.left} x2={width - pad.right} y1={y(v)} y2={y(v)} className="stroke-base-300" strokeWidth="1" />
            <text x={pad.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted font-mono text-[12px]">
              {tickLabel(v)}
            </text>
          </g>
        ))}
        {years.map((year) => (
          <text key={year} x={x(Date.UTC(year, 0, 1))} y={height - 8} textAnchor="middle" className="fill-muted text-[12px]">
            {year}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s)} fill="none" className={s.lineClass} strokeWidth={layout.stroke} strokeLinejoin="round" />
            {s.points.map((p) => (
              <circle key={`${p.competitionId}-${p.value}`} cx={x(Date.parse(p.date))} cy={y(plotValue(p, s.key))} r={layout.dot} className={s.dotClass}>
                <title>{`${s.label} ${formatResult(eventId, p.value, s.key)} · ${p.competitionName} · ${dateLabel(p.competitionId, p.date)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
    );
  };

  const summary = series
    .map((s) => `${s.label}: ${s.points.length} PRs, from ${formatResult(eventId, s.points[0].value, s.key)} to ${formatResult(eventId, s.points.at(-1)!.value, s.key)}`)
    .join(". ");

  return (
    <figure className="space-y-3">
      {/* The PR history below the chart carries the same data for screen readers. */}
      <p className="sr-only">{`PR progression. ${summary}.`}</p>
      {plot(LAYOUTS.narrow, "sm:hidden")}
      {plot(LAYOUTS.wide, "hidden sm:block")}
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={`h-1 w-5 rounded-full ${s.key === "single" ? "bg-primary" : "bg-secondary"}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
