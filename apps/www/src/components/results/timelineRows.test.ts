import { describe, expect, it } from "vitest";
import type { CompetitionMilestones, TimelineEntry } from "@/lib/wca";
import { timelineRows } from "./timelineRows";

const entry = (id: string, date: string): TimelineEntry => ({
  competitionId: id,
  competitionName: id,
  date,
  prs: [{ eventId: "333", kind: "single", value: 1000 }],
});
const reached = (id: string, date: string, label: string): CompetitionMilestones => ({
  competitionId: id,
  competitionName: id,
  date,
  milestones: [{ kind: "competition", number: 100, label }],
});

describe("timelineRows with milestones", () => {
  it("adds milestones to PR rows, and gives milestone-only competitions rows of their own in date order", () => {
    const rows = timelineRows(
      [entry("Newest", "2024-05-01"), entry("Oldest", "2019-01-01")],
      (_, date) => date,
      [reached("Oldest", "2019-01-01", "First competition"), reached("DelegateOnly", "2022-11-12", "50th as Delegate")],
    );
    expect(rows.map((row) => [row.competitionId, row.milestones.map((m) => m.label), row.singles.length])).toEqual([
      ["Newest", [], 1],
      ["DelegateOnly", ["50th as Delegate"], 0],
      ["Oldest", ["First competition"], 1],
    ]);
    expect(rows[1]).toMatchObject({ year: "2022", dateLabel: "2022-11-12", averages: [] });
  });

  it("leaves rows without milestones when none are given", () => {
    expect(timelineRows([entry("Only", "2024-05-01")], (_, date) => date)[0].milestones).toEqual([]);
  });
});
