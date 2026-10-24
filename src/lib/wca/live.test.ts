import { describe, expect, it } from "vitest";
import { livePersonUrl, liveResultSummary, sortLiveResults, type LiveResult } from "./live";

function liveResult(eventId: string, roundNumber: number): LiveResult {
  return {
    id: `${eventId}-${roundNumber}`,
    ranking: 1,
    best: 100,
    average: 120,
    advancing: false,
    advancingQuestionable: false,
    singleRecordTag: null,
    averageRecordTag: null,
    attempts: [{ result: 100 }],
    round: {
      id: `${eventId}-${roundNumber}`,
      name: roundNumber === 1 ? "First Round" : "Final",
      number: roundNumber,
      finished: true,
      competitionEvent: { event: { id: eventId, name: eventId } },
      format: { numberOfAttempts: 5 },
    },
  };
}

describe("sortLiveResults", () => {
  it("orders by official event order, then round", () => {
    const sorted = sortLiveResults([liveResult("skewb", 1), liveResult("333", 2), liveResult("222", 1), liveResult("333", 1)]);
    expect(sorted.map((r) => r.id)).toEqual(["333-1", "333-2", "222-1", "skewb-1"]);
  });
});

describe("livePersonUrl", () => {
  it("links to the person's page on WCA Live", () => {
    expect(livePersonUrl({ competitionId: "11650", personId: "999913" })).toBe(
      "https://live.worldcubeassociation.org/competitions/11650/competitors/999913",
    );
  });
});

describe("liveResultSummary", () => {
  it("shows place and average once the round is done", () => {
    expect(liveResultSummary({ ...liveResult("333", 1), ranking: 9, average: 1111, attempts: Array.from({ length: 5 }, () => ({ result: 1000 })) })).toBe("#9 · 11.11 avg");
  });

  it("falls back to the single when there's no average", () => {
    const result = liveResult("minx", 1);
    expect(liveResultSummary({ ...result, ranking: 4, average: null, best: 5517, attempts: Array.from({ length: 5 }, () => ({ result: 5517 })) })).toBe("#4 · 55.17 single");
  });

  it("counts attempts mid-round", () => {
    expect(liveResultSummary({ ...liveResult("222", 2), attempts: [{ result: 389 }, { result: 452 }] })).toBe("2 of 5 done");
  });
});
