-- Smaller solve rows: ids as uuid (non-UUID ids move to "key"; see
-- src/server/solve-key.ts) and penalty/source/entry as smallint codes (see
-- `coded` in src/server/schema.ts). Devices see the same records, so no
-- change cursor moves. The one ALTER TABLE rewrites the table and its indexes once.
ALTER TABLE "solve" ADD COLUMN "key" text;--> statement-breakpoint
UPDATE "solve" SET "key" = "id" WHERE "id" !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';--> statement-breakpoint
ALTER TABLE "solve"
  ALTER COLUMN "id" SET DATA TYPE uuid USING (CASE WHEN "key" IS NULL THEN "id"::uuid ELSE md5("id")::uuid END),
  ALTER COLUMN "penalty" SET DATA TYPE smallint USING (CASE "penalty" WHEN 'none' THEN 0 WHEN '+2' THEN 1 WHEN 'dnf' THEN 2 END),
  ALTER COLUMN "source" SET DATA TYPE smallint USING (CASE "source" WHEN 'home' THEN 0 WHEN 'competition' THEN 1 END),
  ALTER COLUMN "entry" SET DATA TYPE smallint USING (CASE "entry" WHEN 'timer' THEN 0 WHEN 'typed' THEN 1 WHEN 'stackmat' THEN 2 WHEN 'import' THEN 3 END);
