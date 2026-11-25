import { describe, expect, it } from "vitest";
import { accountChannel, ACCOUNT_CHANNEL_PREFIX, handleAccountChannel } from "./pad";

describe("accountChannel", () => {
  it("is the same for a user every time, and different for each user and secret", () => {
    const a = accountChannel("user-a", "secret");
    expect(a).toBe(accountChannel("user-a", "secret"));
    expect(a.startsWith(ACCOUNT_CHANNEL_PREFIX)).toBe(true);
    expect(a).not.toBe(accountChannel("user-b", "secret"));
    expect(a).not.toBe(accountChannel("user-a", "another secret"));
    // Doesn't give the user's ID away.
    expect(a).not.toContain("user-a");
  });
});

describe("handleAccountChannel", () => {
  const request = new Request("https://timer.test/api/pad/channel");

  it("tells a signed-in person their channel", async () => {
    const response = await handleAccountChannel(request, { secret: "s", getSession: async () => ({ user: { id: "u1" } }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ channel: accountChannel("u1", "s") });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("refuses when signed out", async () => {
    const response = await handleAccountChannel(request, { secret: "s", getSession: async () => null });
    expect(response.status).toBe(401);
  });
});
