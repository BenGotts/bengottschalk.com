import { getDb } from "@/server/db";
import { serverEnv } from "@/server/env";
import { handleCron } from "@/server/wca-routes";

export const maxDuration = 60;

export async function GET(request: Request) {
  const db = getDb();
  if (!db) return Response.json({ error: "No database on this server." }, { status: 503 });
  return handleCron(request, { db, cronSecret: serverEnv("CRON_SECRET") });
}
