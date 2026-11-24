import { describe, expect, it } from "vitest";
import { incomingWins, recordsToApply, remoteWins } from "./sync";

describe("last edit wins", () => {
  it("replaces the server copy only with a strictly newer edit", () => {
    expect(incomingWins({ updatedAt: 2 }, { updatedAt: 1 })).toBe(true);
    expect(incomingWins({ updatedAt: 1 }, { updatedAt: 1 })).toBe(false);
    expect(incomingWins({ updatedAt: 0 }, { updatedAt: 1 })).toBe(false);
    expect(incomingWins({ updatedAt: 0 }, undefined)).toBe(true);
  });

  it("lets the server copy win ties on a device, so devices agree", () => {
    expect(remoteWins({ updatedAt: 1 }, { updatedAt: 1 })).toBe(true);
    expect(remoteWins({ updatedAt: 1 }, { updatedAt: 2 })).toBe(false);
    expect(remoteWins({ updatedAt: 1 }, undefined)).toBe(true);
  });

  it("picks the remote records to apply", () => {
    const local = [{ id: "a", updatedAt: 5 }, { id: "b", updatedAt: 5 }];
    const remote = [{ id: "a", updatedAt: 4 }, { id: "b", updatedAt: 6 }, { id: "c", updatedAt: 1 }];
    expect(recordsToApply(remote, local, (r) => r.id).map((r) => r.id)).toEqual(["b", "c"]);
  });
});
