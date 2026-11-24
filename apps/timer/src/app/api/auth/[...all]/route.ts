import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

const notConfigured = () => Response.json({ error: "Sign-in isn't set up on this server." }, { status: 503 });

export async function GET(request: Request) {
  const auth = getAuth();
  return auth ? toNextJsHandler(auth).GET(request) : notConfigured();
}

export async function POST(request: Request) {
  const auth = getAuth();
  return auth ? toNextJsHandler(auth).POST(request) : notConfigured();
}
