import { getAuth } from "@/lib/auth";
import { getDb } from "@/server/db";
import { handleScrambles } from "@/server/wca-routes";

export async function GET(request: Request) {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return Response.json({ error: "Sign-in isn't set up on this server." }, { status: 503 });
  return handleScrambles(request, { db, getSession: (headers) => auth.api.getSession({ headers }) });
}
