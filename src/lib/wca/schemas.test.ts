import { describe, expect, it } from "vitest";
import { pickDelegateRole } from "./api";
import { PersonSchema, UserRoleSchema, WcifSchema } from "./schemas";

const rank = { best: 105, world_rank: 1253, continent_rank: 339, country_rank: 277 };

describe("PersonSchema", () => {
  it("strips the email and other undeclared fields", () => {
    const parsed = PersonSchema.parse({
      person: {
        wca_id: "2016GOTT01",
        name: "Benjamin Gottschalk",
        url: "https://www.worldcubeassociation.org/persons/2016GOTT01",
        country_iso2: "US",
        country: { id: "USA", name: "United States", continent_id: "_North America", iso2: "US" },
        delegate_status: "regional_delegate",
        email: "private@example.com",
        avatar: { url: "a", thumb_url: "b", is_default: false },
      },
      competition_count: 156,
      personal_records: { "222": { single: { ...rank, id: 1, person_id: "2016GOTT01" } } },
      medals: { gold: 49, silver: 84, bronze: 88, total: 221 },
      records: { national: 0, continental: 1, world: 0, total: 1 },
      total_solves: 5000,
    });
    expect(parsed.person).not.toHaveProperty("email");
    expect(parsed.person.avatar).toEqual({ url: "a", thumb_url: "b", is_default: false });
    expect(parsed.personal_records["222"].single).toEqual(rank);
  });
});

describe("WcifSchema", () => {
  it("drops other competitors' personal details", () => {
    const parsed = WcifSchema.parse({
      id: "Example2026",
      name: "Example 2026",
      persons: [{ wcaId: "2020ABCD01", name: "Someone Else", birthdate: "2000-01-01", email: "x@example.com", assignments: [] }],
      schedule: { startDate: "2026-10-24", numberOfDays: 1, venues: [] },
    });
    expect(parsed.persons[0]).toEqual({ wcaId: "2020ABCD01", assignments: [] });
  });
});

describe("pickDelegateRole", () => {
  it("picks the newest active delegate region role", () => {
    const roles = [
      // The WCA returns a placeholder start date on Ben's original delegate role.
      { id: 1, start_date: "2004-08-01", end_date: null, group: { name: "Pacific Northwest", group_type: "delegate_regions" }, metadata: { status: "delegate" } },
      { id: 2, start_date: "2025-12-11", end_date: null, group: { name: "Pacific Northwest", group_type: "delegate_regions" }, metadata: { status: "regional_delegate" } },
      { id: 3, start_date: "2026-01-01", end_date: null, group: { name: "Software Team", group_type: "teams_committees" }, metadata: { status: "member" } },
    ].map((role) => UserRoleSchema.parse(role));
    expect(pickDelegateRole(roles)).toEqual({ region: "Pacific Northwest", status: "regional_delegate", since: "2025-12-11" });
  });

  it("returns null without a delegate role", () => {
    expect(pickDelegateRole([])).toBeNull();
  });
});
