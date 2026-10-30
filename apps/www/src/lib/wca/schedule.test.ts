import { describe, expect, it } from "vitest";
import { activityName, activityRound, assignmentLabel, formatScheduleTime, getPersonSchedule, groupScheduleByDay, scheduleStatuses } from "./schedule";
import type { Wcif, WcifActivity } from "./schemas";

function activity(id: number, activityCode: string, startTime: string, children: WcifActivity[] = []): WcifActivity {
  return { id, name: activityCode, activityCode, startTime, endTime: startTime, childActivities: children };
}

const wcif: Wcif = {
  id: "Example2026",
  name: "Example 2026",
  events: [
    { id: "333", rounds: [{ id: "333-r1" }, { id: "333-r2" }] },
    { id: "fto", rounds: [{ id: "fto-r1" }] },
  ],
  schedule: {
    startDate: "2026-10-24",
    numberOfDays: 1,
    venues: [
      {
        id: 1,
        name: "Venue",
        timezone: "America/Los_Angeles",
        rooms: [
          {
            id: 1,
            name: "Main Room",
            color: "#304a96",
            activities: [
              activity(1, "333-r1", "2026-10-24T16:00:00Z", [
                activity(10, "333-r1-g1", "2026-10-24T16:00:00Z"),
                activity(11, "333-r1-g2", "2026-10-24T16:30:00Z"),
              ]),
              activity(2, "fto-r1", "2026-10-24T18:00:00Z", [activity(20, "fto-r1-g1", "2026-10-24T18:00:00Z")]),
            ],
          },
        ],
      },
    ],
  },
  persons: [
    {
      wcaId: "2016GOTT01",
      roles: ["delegate", "organizer"],
      registration: { eventIds: ["333", "fto"], status: "accepted" },
      assignments: [
        { activityId: 20, assignmentCode: "competitor", stationNumber: 4 },
        { activityId: 11, assignmentCode: "competitor", stationNumber: null },
        { activityId: 10, assignmentCode: "staff-judge", stationNumber: null },
        { activityId: 999, assignmentCode: "competitor", stationNumber: null },
      ],
    },
    { wcaId: null, registration: null },
  ],
};

describe("getPersonSchedule", () => {
  it("resolves nested activities and sorts by start time", () => {
    const schedule = getPersonSchedule(wcif, "2016GOTT01");
    expect(schedule?.roles).toEqual(["delegate", "organizer"]);
    expect(schedule?.eventIds).toEqual(["333", "fto"]);
    expect(schedule?.entries.map((e) => [e.name, e.assignmentCode, e.stationNumber])).toEqual([
      ["3x3x3 Cube, Round 1, Group 1", "staff-judge", null],
      ["3x3x3 Cube, Round 1, Group 2", "competitor", null],
      ["Face-Turning Octahedron, Final, Group 1", "competitor", 4],
    ]);
    expect(schedule?.entries[0]).toMatchObject({ roomName: "Main Room", timezone: "America/Los_Angeles" });
  });

  it("returns null for someone not at the competition", () => {
    expect(getPersonSchedule(wcif, "2099NOPE01")).toBeNull();
  });
});

describe("schedule display helpers", () => {
  it("labels assignments", () => {
    expect(assignmentLabel("competitor")).toBe("Competing");
    expect(assignmentLabel("staff-judge")).toBe("Judging");
    expect(assignmentLabel("staff-stage-lead")).toBe("Stage lead");
  });

  it("formats times and days in the venue's timezone", () => {
    const entries = getPersonSchedule(wcif, "2016GOTT01")?.entries ?? [];
    // 16:00Z is 9:00 AM in Portland during daylight time.
    expect(formatScheduleTime(entries[0])).toBe("9:00 AM");
    expect(groupScheduleByDay(entries).map((d) => [d.day, d.entries.length])).toEqual([["Saturday, Oct 24", 3]]);
  });
});

describe("scheduleStatuses", () => {
  // Ben's real Spooktacular groups (UTC): 3x3 G5 17:04–17:48, 2x2 G3 17:48–18:30, Megaminx G3 20:16–20:55.
  const entries = [
    { startTime: "2026-10-24T17:04:00Z", endTime: "2026-10-24T17:48:00Z" },
    { startTime: "2026-10-24T17:48:00Z", endTime: "2026-10-24T18:30:00Z" },
    { startTime: "2026-10-24T20:16:00Z", endTime: "2026-10-24T20:55:00Z" },
  ];
  const at = (iso: string) => scheduleStatuses(entries, Date.parse(iso));

  it("marks the first group as next before anything starts", () => {
    expect(at("2026-10-24T16:00:00Z")).toEqual(["next", null, null]);
  });

  it("shows the current group and the one after it during 3x3 Group 5", () => {
    expect(at("2026-10-24T17:10:00Z")).toEqual(["now", "next", null]);
  });

  it("moves on exactly when a group ends", () => {
    expect(at("2026-10-24T17:48:00Z")).toEqual(["done", "now", "next"]);
  });

  it("points to the next group during a break", () => {
    expect(at("2026-10-24T19:00:00Z")).toEqual(["done", "done", "next"]);
  });

  it("marks everything done afterwards", () => {
    expect(at("2026-10-24T23:00:00Z")).toEqual(["done", "done", "done"]);
  });

  it("marks groups starting together as next", () => {
    const together = [
      { startTime: "2026-10-24T17:00:00Z", endTime: "2026-10-24T17:30:00Z" },
      { startTime: "2026-10-24T17:00:00Z", endTime: "2026-10-24T17:45:00Z" },
    ];
    expect(scheduleStatuses(together, Date.parse("2026-10-24T16:00:00Z"))).toEqual(["next", "next"]);
  });
});

describe("activityRound", () => {
  it("reads the event and round from a group", () => {
    expect(activityRound("333-r1-g5")).toEqual({ eventId: "333", roundNumber: 1 });
  });

  it("is null for non-event activities", () => {
    expect(activityRound("other-lunch")).toBeNull();
  });
});

describe("activityName", () => {
  it("names event activities, including attempts", () => {
    expect(activityName("333fm-r1-a2", "ignored")).toBe("3x3x3 Fewest Moves, Round 1, Attempt 2");
  });

  it("names an event's last round Final", () => {
    const roundCounts = new Map([["333", 3]]);
    expect(activityName("333-r2-g1", "ignored", roundCounts)).toBe("3x3x3 Cube, Round 2, Group 1");
    expect(activityName("333-r3-g1", "ignored", roundCounts)).toBe("3x3x3 Cube, Final, Group 1");
  });

  it("uses the schedule name for other activities", () => {
    expect(activityName("other-lunch", "Lunch")).toBe("Lunch");
  });
});
