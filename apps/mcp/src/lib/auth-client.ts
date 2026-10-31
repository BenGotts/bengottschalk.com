import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/react";

/**
 * Browser client for the login and consent pages. The OAuth provider plugin
 * forwards the signed authorization request from the page URL, so signing in
 * continues the MCP client's authorization instead of stopping here.
 */
export const authClient = createAuthClient({ plugins: [oauthProviderClient()] });
