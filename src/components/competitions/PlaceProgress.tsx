// Where I've competed: delegating somewhere doesn't count as competing there,
// so it's shown apart, and upcoming competitions mark the places coming up next.
import { ReactCountryFlag } from "react-country-flag";
import { formatIsoDate, type CountryGoal, type GoalStatus, type StateGoal } from "@/lib/wca";

const TILE: Record<GoalStatus, string> = {
  competed: "bg-secondary text-secondary-content",
  delegated: "border border-primary/60 bg-primary/15",
  upcoming: "border-2 border-dashed border-secondary text-secondary",
  none: "bg-base-300/70 text-muted",
};

const CHIP: Record<GoalStatus, string> = {
  competed: "border-secondary/60 bg-secondary/10",
  delegated: "border-primary/50 bg-primary/10 text-muted",
  upcoming: "border-dashed border-secondary text-muted",
  none: "",
};

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
          <span className={`size-3 rounded-[3px] ${TILE[status]}`} aria-hidden="true" />
          {status === "competed" ? "Competed" : status === "delegated" ? "Delegated only" : "Coming up"}
        </li>
      ))}
    </ul>
  );
}

/** A tile map of the 50 states, coloured by progress. */
function StateMap({ states }: { states: StateGoal[] }) {
  return (
    <ul className="grid grid-cols-11 gap-1" aria-label="US states">
      {states.map((state) => (
        <li
          key={state.code}
          title={`${state.name}: ${describe(state)}`}
          style={{ gridColumnStart: state.col + 1, gridRowStart: state.row + 1 }}
          className={`flex aspect-square items-center justify-center rounded-md text-[0.625rem] font-semibold sm:text-xs ${TILE[state.status]}`}
        >
          <span aria-hidden="true">{state.code}</span>
          <span className="sr-only">{`${state.name}: ${describe(state)}`}</span>
        </li>
      ))}
    </ul>
  );
}

/** Progress towards competing in all 50 states, with a tile map. */
export function StateProgress({ states }: { states: StateGoal[] }) {
  const competed = states.filter((state) => state.status === "competed").length;
  const next = states
    .filter((state) => state.status === "upcoming" && state.competition)
    .toSorted((a, b) => a.competition!.start_date.localeCompare(b.competition!.start_date))[0];

  return (
    <section aria-labelledby="states-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="states-heading" className="scroll-mt-24 text-xl font-bold">US states</h2>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-display text-4xl font-bold text-secondary">{competed}</span>
          <span className="font-display text-xl font-semibold text-muted"> / 50</span>
          <span className="block text-sm text-muted">states competed in</span>
        </p>
        {next && (
          <p className="text-sm text-muted">
            Next new state: <span className="font-medium text-base-content">{next.name}</span>, {formatIsoDate(next.competition!.start_date)}
          </p>
        )}
      </div>
      <progress className="progress progress-secondary w-full" value={competed} max={50} aria-label="US states competed in" />
      <StateMap states={states} />
      <Legend />
    </section>
  );
}

/** Every country with a competition, as flag chips. */
export function CountryList({ countries }: { countries: CountryGoal[] }) {
  const competed = countries.filter((country) => country.status === "competed").length;
  return (
    <section aria-labelledby="countries-heading" className="space-y-4 rounded-box border border-base-300 bg-base-200 p-5">
      <h2 id="countries-heading" className="scroll-mt-24 text-xl font-bold">Countries</h2>
      <p>
        <span className="font-display text-4xl font-bold text-primary">{competed}</span>
        <span className="block text-sm text-muted">{competed === 1 ? "country" : "countries"} competed in</span>
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Countries">
        {countries.map((country) => (
          <li
            key={country.iso2}
            title={`${country.name}: ${describe(country)}`}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${CHIP[country.status]}`}
          >
            <ReactCountryFlag countryCode={country.iso2} svg aria-hidden="true" />
            {country.name}
            {country.count > 1 && <span className="text-xs text-muted">×{country.count}</span>}
            <span className="sr-only">{`: ${describe(country)}`}</span>
          </li>
        ))}
      </ul>
      <Legend />
    </section>
  );
}
