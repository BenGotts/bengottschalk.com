import { getAuth } from "@/lib/auth";
import { serverEnv } from "@/server/env";
import { handleAccountChannel } from "@/server/pad";

export async function GET(request: Request) {
  const auth = getAuth();
  const secret = serverEnv("BETTER_AUTH_SECRET");
  if (!auth || !secret) return Response.json({ error: "Sign-in isn't set up on this server." }, { status: 503 });
  return handleAccountChannel(request, { secret, getSession: (headers) => auth.api.getSession({ headers }) });
}
