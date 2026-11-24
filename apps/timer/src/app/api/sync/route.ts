import { getAuth } from "@/lib/auth";
import { getDb } from "@/server/db";
import { handleSync } from "@/server/sync";

export async function POST(request: Request) {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return Response.json({ error: "Sync isn't set up on this server." }, { status: 503 });
  return handleSync(request, { db, getSession: (headers) => auth.api.getSession({ headers }) });
}
