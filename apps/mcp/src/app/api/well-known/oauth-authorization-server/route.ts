import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { getAuth } from "@/lib/auth";

// Served at /.well-known/oauth-authorization-server[/api/auth] (see next.config.ts).
export function GET(request: Request) {
  return oauthProviderAuthServerMetadata(getAuth())(request);
}
