import { defineConfig } from "drizzle-kit";

// TURSO_DATABASE_URL is a libsql:// URL for Turso, or file:… for a local database.
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "file:../../.data/dev.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
