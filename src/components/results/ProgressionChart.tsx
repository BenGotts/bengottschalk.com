import { eventResultType, formatResult, type PrPoint, type Progression } from "@/lib/wca";

const WIDTH = 720;
const HEIGHT = 300;
const PAD = { left: 64, right: 20, top: 16, bottom: 32 };
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

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const x = (t: number) => PAD.left + ((t - tMin) / (tMax - tMin)) * plotW;
  const y = (v: number) => PAD.top + ((vMax - v) / (vMax - vMin)) * plotH;

  const tickLabel = (v: number) => (isMoves ? v.toFixed(1).replace(/\.0$/, "") : formatResult(eventId, Math.round(v)));
  const firstYear = new Date(tMin).getUTCFullYear() + 1;
  const lastYear = new Date(tMax).getUTCFullYear();
  const yearStep = Math.max(1, Math.ceil((lastYear - firstYear + 1) / 8));
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

  const summary = series
    .map((s) => `${s.label}: ${s.points.length} PRs, from ${formatResult(eventId, s.points[0].value, s.key)} to ${formatResult(eventId, s.points.at(-1)!.value, s.key)}`)
    .join(". ");

  return (
    <figure className="space-y-3">
      {/* The PR history lists below the chart carry the same data for screen readers. */}
      <p className="sr-only">{`PR progression. ${summary}.`}</p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" aria-hidden="true">
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(v)} y2={y(v)} className="stroke-base-300" strokeWidth="1" />
            <text x={PAD.left - 10} y={y(v)} textAnchor="end" dominantBaseline="middle" className="fill-muted font-mono text-[12px]">
              {tickLabel(v)}
            </text>
          </g>
        ))}
        {years.map((year) => {
          const yx = x(Date.UTC(year, 0, 1));
          return (
            <text key={year} x={yx} y={HEIGHT - 8} textAnchor="middle" className="fill-muted text-[12px]">
              {year}
            </text>
          );
        })}
        {series.map((s) => (
          <g key={s.key}>
            <path d={path(s)} fill="none" className={s.lineClass} strokeWidth="2.5" strokeLinejoin="round" />
            {s.points.map((p) => (
              <circle key={`${p.competitionId}-${p.value}`} cx={x(Date.parse(p.date))} cy={y(plotValue(p, s.key))} r="4" className={s.dotClass}>
                <title>{`${s.label} ${formatResult(eventId, p.value, s.key)} · ${p.competitionName} · ${dateLabel(p.competitionId, p.date)}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className={`h-1 w-5 rounded-full ${s.key === "single" ? "bg-primary" : "bg-secondary"}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
        <span>{isMoves ? "Lower is fewer moves." : "Lower is faster."}</span>
      </figcaption>
    </figure>
  );
}
