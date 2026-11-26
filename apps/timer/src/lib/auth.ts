// Sign-in with a WCA account, through better-auth. Server only.
//
// The WCA's OAuth isn't one of better-auth's built-in providers, so it's
// added with the Generic OAuth plugin. WCA sends people back to
// `/api/auth/callback/wca` on the deployment they signed in from; register
// that URL on the WCA OAuth application for production, local development,
// and each preview branch to sign in on (see `previewBaseURL`).
//
// There's no OAuth proxy (sending previews' sign-ins through production):
// better-auth's proxy packs its state into the OAuth `state` parameter, over
// 2,000 characters, and WCA answers any `state` past about 1,700 with an error.

import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, type TimerDb } from "@/server/db";
import { schema } from "@/server/schema";
import { serverEnv } from "@/server/env";

const WCA = "https://www.worldcubeassociation.org";

/** The parts of WCA's `/api/v0/me` the timer uses. Fields the timer doesn't need are dropped. */
const wcaMe = z.object({
  me: z.object({
    id: z.number(),
    name: z.string(),
    wca_id: z.string().nullish(),
    email: z.string().nullish(),
    avatar: z.object({ url: z.string().nullish(), thumb_url: z.string().nullish() }).nullish(),
  }),
});

/**
 * WCA IDs from profiles just fetched, by WCA account number, waiting for the
 * account hook below to save them. better-auth won't save `wcaId` from the
 * profile itself: it's `input: false` (so nobody can set their own through
 * better-auth's update-user endpoint), and better-auth drops such fields from
 * provider profiles too. Both steps run in the same sign-in request.
 */
const pendingWcaIds = new Map<string, string | null>();

/**
 * Saves the WCA ID fetched during this sign-in onto the user. Runs after
 * better-auth creates or updates the person's WCA account row.
 */
export async function saveWcaIdForAccount(db: TimerDb, account: { providerId?: string; accountId?: string; userId?: string } | null | undefined): Promise<void> {
  if (!account || account.providerId !== "wca" || !account.accountId || !account.userId) return;
  if (!pendingWcaIds.has(account.accountId)) return;
  const wcaId = pendingWcaIds.get(account.accountId) ?? null;
  pendingWcaIds.delete(account.accountId);
  await db.update(schema.user).set({ wcaId }).where(eq(schema.user.id, account.userId));
}

/** Looks up the signed-in WCA account. */
async function fetchWcaProfile(accessToken: string | undefined) {
  if (!accessToken) return null;
  const response = await fetch(`${WCA}/api/v0/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  const parsed = wcaMe.safeParse(await response.json());
  if (!parsed.success) return null;
  const { me } = parsed.data;
  pendingWcaIds.set(String(me.id), me.wca_id ?? null);
  return {
    id: String(me.id),
    name: me.name,
    // better-auth needs an email; WCA always sends one with the `email` scope.
    // `.invalid` is a reserved domain, so the fallback can never reach anyone.
    email: me.email ?? `wca-${me.id}@users.invalid`,
    emailVerified: me.email != null,
    image: me.avatar?.thumb_url ?? me.avatar?.url ?? undefined,
    wcaId: me.wca_id ?? null,
  };
}

export interface AuthConfig {
  db: TimerDb;
  secret: string;
  baseURL?: string;
  wca: { clientId: string; clientSecret: string };
  /** Extra plugins (tests add better-auth's test utilities). */
  plugins?: BetterAuthPlugin[];
}

export function createAuth({ db, secret, baseURL, wca, plugins = [] }: AuthConfig) {
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    user: {
      additionalFields: {
        wcaId: { type: "string", required: false, input: false },
      },
    },
    databaseHooks: {
      // New sign-ins create the account row; returning ones update its tokens.
      account: {
        create: { after: (account) => saveWcaIdForAccount(db, account) },
        update: { after: (account) => saveWcaIdForAccount(db, account) },
      },
    },
    plugins: [
      genericOAuth({
        config: [
          {
            providerId: "wca",
            name: "WCA",
            clientId: wca.clientId,
            clientSecret: wca.clientSecret,
            authorizationUrl: `${WCA}/oauth/authorize`,
            tokenUrl: `${WCA}/oauth/token`,
            scopes: ["public", "email"],
            getUserInfo: (tokens) => fetchWcaProfile(tokens.accessToken),
            mapProfileToUser: (profile) => ({
              name: typeof profile.name === "string" ? profile.name : undefined,
              email: typeof profile.email === "string" ? profile.email : undefined,
              image: typeof profile.image === "string" ? profile.image : undefined,
              emailVerified: profile.emailVerified,
              wcaId: typeof profile.wcaId === "string" ? profile.wcaId : null,
            }),
            // Refresh the name, picture and WCA ID on every sign-in (a newcomer gets a WCA ID after their first competition).
            overrideUserInfo: true,
          },
        ],
      }),
      ...plugins,
      // Must be last: lets server actions set cookies.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Whether sign-in is set up (every variable it needs is present). */
export function isAuthConfigured(): boolean {
  return ["DATABASE_URL", "BETTER_AUTH_SECRET", "WCA_CLIENT_ID", "WCA_CLIENT_SECRET"].every((name) => serverEnv(name) !== undefined);
}

/**
 * On a Vercel preview, the branch's own URL (like
 * `timerbengottschalkcom-git-<branch>-<team>.vercel.app`), which stays the
 * same for every deployment of the branch, so it can be registered with WCA
 * once: `https://<that host>/api/auth/callback/wca`. Sign in from that URL,
 * not a single deployment's. Null anywhere else.
 */
export function previewBaseURL(env: Record<string, string | undefined> = process.env): string | null {
  return env.VERCEL_ENV === "preview" && env.VERCEL_BRANCH_URL ? `https://${env.VERCEL_BRANCH_URL}` : null;
}

let cached: Auth | null = null;

/** The app's auth, or null when sign-in isn't set up (the timer then stays local-only). */
export function getAuth(): Auth | null {
  if (cached) return cached;
  const db = getDb();
  const [BETTER_AUTH_SECRET, BETTER_AUTH_URL, WCA_CLIENT_ID, WCA_CLIENT_SECRET] =
    ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "WCA_CLIENT_ID", "WCA_CLIENT_SECRET"].map(serverEnv);
  if (!db || !BETTER_AUTH_SECRET || !WCA_CLIENT_ID || !WCA_CLIENT_SECRET) return null;
  cached = createAuth({
    db,
    secret: BETTER_AUTH_SECRET,
    baseURL: previewBaseURL() ?? BETTER_AUTH_URL,
    wca: { clientId: WCA_CLIENT_ID, clientSecret: WCA_CLIENT_SECRET },
  });
  return cached;
}
