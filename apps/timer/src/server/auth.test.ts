// Signs in with WCA end to end (start, WCA's redirect back, token exchange,
// profile lookup, saving the user) against PGlite, with WCA's servers faked.
// This is the path where the WCA ID must end up on the user.

import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createAuth, previewBaseURL } from "@/lib/auth";
import type { TimerDb } from "./db";
import { schema } from "./schema";

const BASE = "http://localhost:3004";
let db: TimerDb;
let auth: ReturnType<typeof createAuth>;

beforeAll(async () => {
  const pglite = drizzle(new PGlite(), { schema });
  await migrate(pglite, { migrationsFolder: fileURLToPath(new URL("../../drizzle", import.meta.url)) });
  db = pglite;
  auth = createAuth({ db, secret: "test-secret-test-secret-test-secret", baseURL: BASE, wca: { clientId: "id", clientSecret: "secret" } });
}, 60_000);

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Fakes WCA's token and `/me` endpoints; everything else goes to the real fetch. */
function fakeWca(me: { id: number; name: string; wca_id: string | null; email: string }) {
  const realFetch = globalThis.fetch;
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url.startsWith("https://www.worldcubeassociation.org/oauth/token")) {
      return Response.json({ access_token: "token", token_type: "Bearer", expires_in: 7200, scope: "public email" });
    }
    if (url.startsWith("https://www.worldcubeassociation.org/api/v0/me")) {
      return Response.json({ me: { ...me, avatar: { url: "https://example.com/a.jpg", thumb_url: "https://example.com/t.jpg" } } });
    }
    return realFetch(input, init);
  });
}

/** Cookies a response sets, as a Cookie header. */
const cookiesFrom = (response: Response) =>
  response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");

/** Starts sign-in, then comes back from WCA the way a browser would. */
async function signInWithWca(): Promise<Response> {
  const start = await auth.handler(new Request(`${BASE}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ provider: "wca", callbackURL: "/" }),
  }));
  expect(start.status).toBe(200);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const { url } = (await start.json()) as { url: string };
  const state = new URL(url).searchParams.get("state");
  expect(state).toBeTruthy();
  return auth.handler(new Request(`${BASE}/api/auth/callback/wca?code=code&state=${state}`, {
    headers: { cookie: cookiesFrom(start) },
  }));
}

const userByEmail = async (email: string) => (await db.select().from(schema.user).where(eq(schema.user.email, email)))[0];

describe("signing in with WCA", () => {
  it("saves the WCA ID on a new user", async () => {
    fakeWca({ id: 101, name: "Ben", wca_id: "2016GOTT01", email: "ben@example.com" });
    const callback = await signInWithWca();
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).not.toContain("error");
    const user = await userByEmail("ben@example.com");
    expect(user?.wcaId).toBe("2016GOTT01");
    expect(user?.image).toBe("https://example.com/t.jpg");
  });

  it("updates the WCA ID when a returning user gets one (e.g. after a first competition)", async () => {
    fakeWca({ id: 202, name: "New Cuber", wca_id: null, email: "new@example.com" });
    await signInWithWca();
    expect((await userByEmail("new@example.com"))?.wcaId).toBeNull();

    fakeWca({ id: 202, name: "New Cuber", wca_id: "2026CUBE01", email: "new@example.com" });
    await signInWithWca();
    expect((await userByEmail("new@example.com"))?.wcaId).toBe("2026CUBE01");
  });

  it("doesn't let a signed-in person set their own WCA ID", async () => {
    fakeWca({ id: 303, name: "Someone", wca_id: "2020SOME01", email: "someone@example.com" });
    const callback = await signInWithWca();
    const update = await auth.handler(new Request(`${BASE}/api/auth/update-user`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE, cookie: cookiesFrom(callback) },
      body: JSON.stringify({ wcaId: "2016GOTT01" }),
    }));
    expect(update.status).toBe(400);
    expect((await userByEmail("someone@example.com"))?.wcaId).toBe("2020SOME01");
  });
});

describe("previewBaseURL", () => {
  it("is the branch URL on a Vercel preview, and nothing elsewhere", () => {
    expect(previewBaseURL({ VERCEL_ENV: "preview", VERCEL_BRANCH_URL: "timer-git-x-team.vercel.app" })).toBe("https://timer-git-x-team.vercel.app");
    expect(previewBaseURL({ VERCEL_ENV: "production", VERCEL_BRANCH_URL: "timer-git-main-team.vercel.app" })).toBeNull();
    expect(previewBaseURL({})).toBeNull();
  });
});
