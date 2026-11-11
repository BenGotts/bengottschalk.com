// Where I've competed: delegating somewhere doesn't count as competing there,
// so it's shown apart, and upcoming competitions mark the places coming up next.
import { Fragment, type CSSProperties } from "react";
import { US_STATE_SHAPES, VIEW_BOX as US_VIEW_BOX } from "@/content/maps/usStates";
import { COUNTRY_SHAPES, VIEW_BOX as WORLD_VIEW_BOX } from "@/content/maps/worldCountries";
import { ReactCountryFlag } from "react-country-flag";
import { cubingUsaRegion, formatIsoDate, regionProgress, type CountryGoal, type GoalStatus, type StateGoal } from "@/lib/wca";
import MapExplorer, { type PlaceInfo } from "./MapExplorer";
import { regionColor, regionSlug, regionWash } from "./regionColors";

// World map fills; "upcoming" uses the striped pattern below. The US map
// colors each state by its CubingUSA region instead (see stateFill).
const FILL: Record<GoalStatus, string> = {
  competed: "fill-secondary",
  delegated: "fill-primary/50",
  upcoming: "",
  none: "fill-base-300",
};

const LABEL: Record<Exclude<GoalStatus, "none">, string> = { competed: "Competed", delegated: "Delegated only", upcoming: "Coming up" };

function describe(goal: { status: GoalStatus; competition: StateGoal["competition"] }): string {
  const at = goal.competition ? ` at ${goal.competition.name}, ${formatIsoDate(goal.competition.start_date)}` : "";
  if (goal.status === "competed") return `competed, first${at}`;
  if (goal.status === "delegated") return `delegated only, first${at}`;
  if (goal.status === "upcoming") return `coming up${at}`;
  return "not yet";
}

const INK = "var(--color-base-content)";
const INK_WASH = `color-mix(in oklab, ${INK} 22%, transparent)`;

// The US map's patterns, in a neutral ink since each state takes its region's color.
const SWATCH: Record<GoalStatus, { label: string; style: CSSProperties }> = {
  competed: { label: "Competed", style: { backgroundColor: INK } },
  delegated: {
    label: "Delegated only",
    style: { backgroundColor: INK_WASH, backgroundImage: `radial-gradient(${INK} 1px, transparent 1.3px)`, backgroundSize: "4px 4px" },
  },
  upcoming: { label: "Coming up", style: { backgroundColor: INK_WASH, backgroundImage: `repeating-linear-gradient(135deg, ${INK} 0 1.5px, transparent 1.5px 4px)` } },
  none: { label: "Not yet", style: { backgroundColor: INK_WASH } },
};

/** How the US map shows each status; the region cards say which color is which region. */
function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {(["competed", "delegated", "upcoming", "none"] as const).map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] opacity-80" style={SWATCH[status].style} aria-hidden="true" />
          {SWATCH[status].label}
        </li>
      ))}
    </ul>
  );
}

const NOT_YET_WASH = 30;

/** Dots (delegated only) and stripes (coming up) in each region's color. */
function RegionPatterns({ regions }: { regions: string[] }) {
  return (
    <defs>
      {regions.map((name) => (
        <Fragment key={name}>
          <pattern id={`dots-${regionSlug(name)}`} width="5" height="5" patternUnits="userSpaceOnUse">
            <rect width="5" height="5" style={{ fill: regionWash(name, NOT_YET_WASH) }} />
            <circle cx="2.5" cy="2.5" r="1.3" style={{ fill: regionColor(name) }} />
          </pattern>
          <pattern id={`stripes-${regionSlug(name)}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="6" style={{ fill: regionWash(name, NOT_YET_WASH) }} />
            <rect width="2.5" height="6" style={{ fill: regionColor(name) }} />
          </pattern>
        </Fragment>
      ))}
    </defs>
  );
}

/** A state's fill: its region's color, solid where I've competed and lighter or patterned elsewhere. */
function stateFill(status: GoalStatus, region: string): string {
  if (status === "competed") return regionColor(region);
  if (status === "delegated") return `url(#dots-${regionSlug(region)})`;
  if (status === "upcoming") return `url(#stripes-${regionSlug(region)})`;
  return regionWash(region, NOT_YET_WASH);
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

/**
 * A place on a map. With a `code`, MapExplorer selects it on click; places
 * with a status are also buttons for the keyboard and screen readers.
 */
function Shape({ d, code, status, label, strokeWidth, stripesId, fill }: {
  d: string;
  code?: string;
  status: GoalStatus;
  label: string;
  strokeWidth: number;
  stripesId?: string;
  /** Overrides the status fill, e.g. with a region's color. */
  fill?: string;
}) {
  const interactive = code !== undefined && status !== "none";
  return (
    <path
      d={d}
      data-place={code}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
      className={`stroke-base-200 transition-opacity outline-none hover:opacity-75 focus-visible:opacity-75 data-dim:opacity-25 ${code ? "cursor-pointer" : ""} ${fill ? "" : FILL[status]}`}
      fill={!fill && status === "upcoming" ? `url(#${stripesId})` : undefined}
      style={fill ? { fill } : undefined}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      {label && <title>{label}</title>}
    </path>
  );
}

const placeInfo = (goal: StateGoal | CountryGoal, region?: string): PlaceInfo => ({ name: goal.name, status: goal.status, visits: goal.visits, region });

const STATE_BY_NAME = new Map<string, string>(US_STATE_SHAPES.map((shape) => [shape.name, shape.d]));

/** Progress towards competing in all 50 states, on a map. */
export function StateProgress({ states }: { states: StateGoal[] }) {
  const regions = regionProgress(states);
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
      <MapExplorer
        places={Object.fromEntries(states.map((state) => [state.code, placeInfo(state, cubingUsaRegion(state.code))]))}
        regions={regions}
        hint="Tap a state or region to see its competitions."
        map={
          <svg viewBox={US_VIEW_BOX} className="w-full" aria-label="Map of US states">
            <RegionPatterns regions={regions.map((region) => region.name)} />
            {states.map((state) => {
              const d = STATE_BY_NAME.get(state.name);
              const region = cubingUsaRegion(state.code) ?? "";
              return d && (
                <Shape
                  key={state.code}
                  d={d}
                  code={state.code}
                  status={state.status}
                  label={`${state.name} (${region}): ${describe(state)}`}
                  strokeWidth={1}
                  fill={stateFill(state.status, region)}
                />
              );
            })}
          </svg>
        }
      >
        <Legend />
      </MapExplorer>
    </section>
  );
}

const SCROLL_AFTER = 6;

/**
 * Countries on a world map, with a list (small countries can be hard to spot
 * on the map). Past six countries the list scrolls: from lg up inside a card
 * that matches the states card's height, and on phones in a fixed-height box.
 */
export function CountryProgress({ countries }: { countries: CountryGoal[] }) {
  const competed = countries.filter((country) => country.status === "competed").length;
  const scrolls = countries.length > SCROLL_AFTER;
  const byIso2 = new Map(countries.map((country) => [country.iso2, country]));

  return (
    <section aria-labelledby="countries-heading" className="flex flex-col gap-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="countries-heading" className="scroll-mt-24 text-xl font-bold">Countries</h2>
      <p>
        <span className="font-display text-4xl font-bold text-primary">{competed}</span>
        <span className="block text-sm text-muted">{competed === 1 ? "country" : "countries"} competed in</span>
      </p>
      <MapExplorer
        places={Object.fromEntries(countries.map((country) => [country.iso2, placeInfo(country)]))}
        hint="Tap a country on the map or in the list to see its competitions."
        map={
          <svg viewBox={WORLD_VIEW_BOX} className="w-full" aria-label="World map">
            <Stripes id="country-stripes" />
            {/* A few countries have more than one shape, such as Australia's outlying islands. */}
            {COUNTRY_SHAPES.map((shape, index) => {
              const country = byIso2.get(shape.iso2);
              return (
                <Shape
                  key={`${shape.iso2}-${index}`}
                  d={shape.d}
                  code={country?.iso2}
                  status={country?.status ?? "none"}
                  label={country ? `${country.name}: ${describe(country)}` : ""}
                  strokeWidth={0.5}
                  stripesId="country-stripes"
                />
              );
            })}
          </svg>
        }
      >
        {/* Up to SCROLL_AFTER countries just show. Past that the list scrolls, absolutely
            placed from lg up so it doesn't add to the card's height, with room for three rows. */}
        <div className={scrolls ? "relative min-h-40 flex-1 lg:min-h-48" : ""}>
          <ul
            aria-label="Countries"
            className={`grid content-start gap-x-6 gap-y-1 border-t border-base-300 pt-3 sm:grid-cols-2 ${
              scrolls ? "max-h-72 overflow-y-auto border-b pr-2 pb-3 lg:absolute lg:inset-0 lg:max-h-none" : ""
            }`}
          >
            {countries.map((country) => (
              <li key={country.iso2}>
                <button
                  type="button"
                  data-place={country.iso2}
                  className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-field px-2 py-1 text-left transition-colors hover:bg-base-300/50 aria-pressed:bg-base-300/70 data-dim:opacity-50"
                >
                  <ReactCountryFlag countryCode={country.iso2} svg aria-hidden="true" className="shrink-0 rounded-[2px]" style={{ width: "1.5em", height: "1.125em" }} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{country.name}</span>
                    <span className="block text-xs text-muted">
                      {country.status === "upcoming" && country.competition
                        ? `Coming up: ${country.competition.name}, ${formatIsoDate(country.competition.start_date)}`
                        : `${country.count} ${country.count === 1 ? "competition" : "competitions"} · since ${country.competition?.start_date.slice(0, 4)}`}
                    </span>
                  </span>
                  {country.status !== "competed" && (
                    <span className={`badge badge-sm whitespace-nowrap ${country.status === "delegated" ? "border-primary/60 bg-primary/10" : "border-dashed border-secondary"}`}>
                      {LABEL[country.status as Exclude<GoalStatus, "none" | "competed">]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </MapExplorer>
    </section>
  );
}
