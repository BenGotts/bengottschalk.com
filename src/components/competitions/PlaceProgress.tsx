// Where I've competed: delegating somewhere doesn't count as competing there,
// so it's shown apart, and upcoming competitions mark the places coming up next.
import { US_STATE_SHAPES, VIEW_BOX as US_VIEW_BOX } from "@/content/maps/usStates";
import { COUNTRY_SHAPES, VIEW_BOX as WORLD_VIEW_BOX } from "@/content/maps/worldCountries";
import CountryList, { type CountryRow } from "./CountryList";
import { formatIsoDate, type CountryGoal, type GoalStatus, type StateGoal } from "@/lib/wca";

// Map fills; "upcoming" uses the striped pattern below.
const FILL: Record<GoalStatus, string> = {
  competed: "fill-secondary",
  delegated: "fill-primary/50",
  upcoming: "",
  none: "fill-base-300",
};

const SWATCH: Record<Exclude<GoalStatus, "none">, string> = {
  competed: "bg-secondary",
  delegated: "bg-primary/50",
  upcoming: "bg-[repeating-linear-gradient(135deg,var(--color-secondary)_0_2px,transparent_2px_5px)] ring-1 ring-secondary ring-inset",
};

const LABEL: Record<Exclude<GoalStatus, "none">, string> = { competed: "Competed", delegated: "Delegated only", upcoming: "Coming up" };

function describe(goal: { status: GoalStatus; competition: StateGoal["competition"] }): string {
  const at = goal.competition ? ` at ${goal.competition.name}, ${formatIsoDate(goal.competition.start_date)}` : "";
  if (goal.status === "competed") return `competed, first${at}`;
  if (goal.status === "delegated") return `delegated only, first${at}`;
  if (goal.status === "upcoming") return `coming up${at}`;
  return "not yet";
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {(["competed", "delegated", "upcoming"] as const).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className={`size-3 rounded-[3px] ${SWATCH[status]}`} aria-hidden="true" />
          {LABEL[status]}
        </li>
      ))}
    </ul>
  );
}

/** Diagonal stripes in the secondary colour, for places coming up. */
function Stripes({ id }: { id: string }) {
  return (
    <defs>
      <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" className="fill-secondary/15" />
        <rect width="2.5" height="6" className="fill-secondary/70" />
      </pattern>
    </defs>
  );
}

function Shape({ d, status, label, strokeWidth, stripesId }: { d: string; status: GoalStatus; label: string; strokeWidth: number; stripesId: string }) {
  return (
    <path
      d={d}
      className={`stroke-base-200 transition-opacity hover:opacity-75 ${FILL[status]}`}
      fill={status === "upcoming" ? `url(#${stripesId})` : undefined}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      <title>{label}</title>
    </path>
  );
}

const STATE_BY_NAME = new Map<string, string>(US_STATE_SHAPES.map((shape) => [shape.name, shape.d]));

/** Progress towards competing in all 50 states, on a map. */
export function StateProgress({ states }: { states: StateGoal[] }) {
  const competed = states.filter((state) => state.status === "competed");
  const next = states
    .filter((state) => state.status === "upcoming" && state.competition)
    .toSorted((a, b) => a.competition!.start_date.localeCompare(b.competition!.start_date))[0];

  return (
    <section aria-labelledby="states-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="states-heading" className="scroll-mt-24 text-xl font-bold">US states</h2>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-display text-4xl font-bold text-secondary">{competed.length}</span>
          <span className="font-display text-xl font-semibold text-muted"> / 50</span>
          <span className="block text-sm text-muted">states competed in</span>
        </p>
        {next && (
          <p className="text-sm text-muted">
            Next new state: <span className="font-medium text-base-content">{next.name}</span>, {formatIsoDate(next.competition!.start_date)}
          </p>
        )}
      </div>
      <progress className="progress progress-secondary w-full" value={competed.length} max={50} aria-label="US states competed in" />
      <svg viewBox={US_VIEW_BOX} className="w-full" aria-hidden="true">
        <Stripes id="state-stripes" />
        {states.map((state) => {
          const d = STATE_BY_NAME.get(state.name);
          return d && <Shape key={state.code} d={d} status={state.status} label={`${state.name}: ${describe(state)}`} strokeWidth={1} stripesId="state-stripes" />;
        })}
      </svg>
      {/* The map is hidden from screen readers; this says the same. */}
      <ul className="sr-only">
        {states.filter((state) => state.status !== "none").map((state) => (
          <li key={state.code}>{`${state.name}: ${describe(state)}`}</li>
        ))}
      </ul>
      <Legend />
    </section>
  );
}

function countryRow(country: CountryGoal): CountryRow {
  const upcoming = country.status === "upcoming" && country.competition;
  return {
    iso2: country.iso2,
    name: country.name,
    detail: upcoming
      ? `Coming up: ${country.competition!.name}, ${formatIsoDate(country.competition!.start_date)}`
      : `${country.count} ${country.count === 1 ? "competition" : "competitions"} · since ${country.competition?.start_date.slice(0, 4)}`,
    badge:
      country.status === "delegated" ? { label: LABEL.delegated, className: "border-primary/60 bg-primary/10" }
      : country.status === "upcoming" ? { label: LABEL.upcoming, className: "border-dashed border-secondary" }
      : null,
  };
}

/** Countries on a world map, with a list (small countries can be hard to spot on the map). */
export function CountryProgress({ countries }: { countries: CountryGoal[] }) {
  const competed = countries.filter((country) => country.status === "competed").length;
  const byIso2 = new Map(countries.map((country) => [country.iso2, country]));

  return (
    <section aria-labelledby="countries-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="countries-heading" className="scroll-mt-24 text-xl font-bold">Countries</h2>
      <p>
        <span className="font-display text-4xl font-bold text-primary">{competed}</span>
        <span className="block text-sm text-muted">{competed === 1 ? "country" : "countries"} competed in</span>
      </p>
      <svg viewBox={WORLD_VIEW_BOX} className="w-full" aria-hidden="true">
        <Stripes id="country-stripes" />
        {COUNTRY_SHAPES.map((shape) => {
          const country = byIso2.get(shape.iso2);
          return (
            <Shape
              key={shape.iso2}
              d={shape.d}
              status={country?.status ?? "none"}
              label={country ? `${country.name}: ${describe(country)}` : ""}
              strokeWidth={0.5}
              stripesId="country-stripes"
            />
          );
        })}
      </svg>
      <CountryList rows={countries.map(countryRow)} />
      <Legend />
    </section>
  );
}
