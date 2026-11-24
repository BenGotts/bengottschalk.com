// Sign-in with a WCA account, through better-auth. Server only.
//
// The WCA's OAuth isn't one of better-auth's built-in providers, so it's
// added with the Generic OAuth plugin. WCA sends people back to
// `/api/auth/callback/wca`; register that URL on the WCA OAuth application.

import { betterAuth, type BetterAuthPlugin } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";
import { z } from "zod";
import { TIMER_URL } from "@bengottschalk/content/site";
import { getDb, type TimerDb } from "@/server/db";
import { schema } from "@/server/schema";

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

/** Looks up the signed-in WCA account. */
async function fetchWcaProfile(accessToken: string | undefined) {
  if (!accessToken) return null;
  const response = await fetch(`${WCA}/api/v0/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) return null;
  const parsed = wcaMe.safeParse(await response.json());
  if (!parsed.success) return null;
  const { me } = parsed.data;
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
  // Preview deployments can't each be registered with WCA, so on Vercel, WCA
  // always returns to production and the OAuth proxy hands the sign-in back
  // to the preview. (Previews must share production's database and secret.)
  // Anywhere else (local development), sign-in returns to this app's own URL.
  const proxyProductionURL = process.env.VERCEL_ENV ? TIMER_URL : baseURL;
  return betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    user: {
      additionalFields: {
        wcaId: { type: "string", required: false, input: false },
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
      oAuthProxy({ productionURL: proxyProductionURL }),
      ...plugins,
      // Must be last: lets server actions set cookies.
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

/** Whether sign-in is set up (every variable it needs is present). */
export function isAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.WCA_CLIENT_ID && process.env.WCA_CLIENT_SECRET);
}

let cached: Auth | null = null;

/** The app's auth, or null when sign-in isn't set up (the timer then stays local-only). */
export function getAuth(): Auth | null {
  if (cached) return cached;
  const db = getDb();
  const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, WCA_CLIENT_ID, WCA_CLIENT_SECRET } = process.env;
  if (!db || !BETTER_AUTH_SECRET || !WCA_CLIENT_ID || !WCA_CLIENT_SECRET) return null;
  cached = createAuth({
    db,
    secret: BETTER_AUTH_SECRET,
    baseURL: BETTER_AUTH_URL,
    wca: { clientId: WCA_CLIENT_ID, clientSecret: WCA_CLIENT_SECRET },
  });
  return cached;
}
