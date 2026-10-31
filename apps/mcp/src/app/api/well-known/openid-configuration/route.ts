import { oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/lib/auth";

// Served at /.well-known/openid-configuration[/api/auth] (see next.config.ts).
export function GET(request: Request) {
  return oauthProviderOpenIdConfigMetadata(getAuth())(request);
}
