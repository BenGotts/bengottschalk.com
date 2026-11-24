import { getAuth } from "@/lib/auth";
import { getDb } from "@/server/db";
import { handleImportResults } from "@/server/wca-routes";

// Importing a first batch of results can take a while (schedules are fetched one by one).
export const maxDuration = 60;

export async function POST(request: Request) {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return Response.json({ error: "Sign-in isn't set up on this server." }, { status: 503 });
  return handleImportResults(request, { db, getSession: (headers) => auth.api.getSession({ headers }) });
}
