import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { mcp } from "@better-auth/mcp";
import { getDb } from "@bengottschalk/db";
import * as schema from "@bengottschalk/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";

/** Where this app is served, e.g. https://mcp.bengottschalk.com. */
export const APP_URL = (process.env.BETTER_AUTH_URL ?? "http://localhost:3003").replace(/\/$/, "");

/** The signed-in MCP endpoint; access tokens are issued for it alone. */
export const PRIVATE_MCP_URL = `${APP_URL}/private`;

/**
 * Sign-in is for one person: the owner, identified by the primary email of
 * their GitHub account. Anyone else is refused before an account is created.
 */
function isOwner(email: string) {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  return Boolean(owner) && email.trim().toLowerCase() === owner;
}

function createAuth() {
  // Local only: email and password sign-in, for testing the OAuth flow without GitHub.
  const devPasswordSignIn = process.env.NODE_ENV === "development";

  return betterAuth({
    baseURL: APP_URL,
    database: drizzleAdapter(getDb(), { provider: "sqlite", schema }),
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      },
    },
    emailAndPassword: { enabled: devPasswordSignIn },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (!isOwner(user.email)) throw new APIError("FORBIDDEN", { message: "This server is private." });
          },
        },
      },
    },
    plugins: [
      jwt(),
      mcp({
        resource: PRIVATE_MCP_URL,
        loginPage: "/login",
        consentPage: "/consent",
        // Claude and other MCP clients register themselves, through a Client ID
        // Metadata Document (below) or, for older clients, dynamic registration.
        // Registering doesn't grant anything: only the owner can sign in and approve.
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
      }),
      cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

/** The auth server, created on first use so builds don't need the database. */
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
