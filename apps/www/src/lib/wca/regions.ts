import type { StateGoal } from "./goals";

/**
 * The CubingUSA regions, each with its own Regional Championship, as listed on
 * cubingusa.org/state_rankings. CubingUSA also places DC and the territories in
 * regions; only the 50 states count here.
 */
export const CUBING_USA_REGIONS = [
  { name: "Great Lakes", states: ["IL", "IN", "KY", "MI", "OH", "WI"] },
  { name: "Heartland", states: ["IA", "KS", "MN", "MO", "NE", "ND", "SD"] },
  { name: "Mid-Atlantic", states: ["DE", "MD", "NJ", "NY", "PA", "VA", "WV"] },
  { name: "New England", states: ["CT", "ME", "MA", "NH", "RI", "VT"] },
  { name: "Northwest", states: ["AK", "OR", "WA"] },
  { name: "Rocky Mountain", states: ["AZ", "CO", "ID", "MT", "NM", "UT", "WY"] },
  { name: "South", states: ["AR", "LA", "MS", "OK", "TX"] },
  { name: "Southeast", states: ["AL", "FL", "GA", "NC", "SC", "TN"] },
  { name: "West", states: ["CA", "HI", "NV"] },
] as const;

const REGION_BY_STATE = new Map<string, string>(CUBING_USA_REGIONS.flatMap((region) => region.states.map((code) => [code, region.name] as const)));

/** The CubingUSA region a state is in. */
export function cubingUsaRegion(stateCode: string): string | undefined {
  return REGION_BY_STATE.get(stateCode);
}

export interface RegionProgress {
  name: string;
  /** The region's state codes. */
  states: string[];
  competed: number;
}

/** States competed in, region by region. */
export function regionProgress(states: StateGoal[]): RegionProgress[] {
  const competed = new Set(states.filter((state) => state.status === "competed").map((state) => state.code));
  return CUBING_USA_REGIONS.map((region) => ({
    name: region.name,
    states: [...region.states],
    competed: region.states.filter((code) => competed.has(code)).length,
  }));
}
