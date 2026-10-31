import { createClient } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

/** A database for the given Turso URL (`libsql://…`), or a local SQLite file (`file:…`) in development and tests. */
export function createDb(url: string, authToken?: string): Db {
  return drizzle(createClient({ url, authToken }), { schema });
}

let db: Db | undefined;

/**
 * The shared database, from `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
 * Created on first use, so builds don't need the variables.
 */
export function getDb(): Db {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    db = createDb(url, process.env.TURSO_AUTH_TOKEN || undefined);
  }
  return db;
}
