import { APP_URL, getAuth } from "@/lib/auth";

// Served at /.well-known/oauth-protected-resource[/private] (see next.config.ts).
// The mcp() plugin answers this path itself, so pass it the path it expects.
export function GET(request: Request) {
  return getAuth().handler(new Request(`${APP_URL}/.well-known/oauth-protected-resource/private`, { headers: request.headers }));
}
