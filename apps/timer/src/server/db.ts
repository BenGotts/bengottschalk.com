import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { schema } from "./schema";
import { serverEnv } from "./env";

/** Any Drizzle Postgres database with the timer's schema (postgres.js in production, PGlite in tests). */
export type TimerDb = PgDatabase<PgQueryResultHKT, typeof schema>;

let cached: TimerDb | null = null;

/**
 * The database, or null when DATABASE_URL isn't set (sign-in and sync are
 * then unavailable and the timer stays local-only).
 *
 * `prepare: false` because Supabase's transaction pooler (port 6543, the
 * right choice for serverless functions) doesn't support prepared statements.
 */
export function getDb(): TimerDb | null {
  const url = serverEnv("DATABASE_URL");
  if (!url) return null;
  cached ??= drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
  return cached;
}
