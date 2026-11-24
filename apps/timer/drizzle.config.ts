import { defineConfig } from "drizzle-kit";

// `npm run db:generate -w apps/timer` writes a migration after a schema change;
// `npm run db:migrate -w apps/timer` applies them to DATABASE_URL.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
