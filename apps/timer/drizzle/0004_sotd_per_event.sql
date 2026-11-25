ALTER TABLE "sotd_mark" ADD COLUMN "event_id" text;--> statement-breakpoint
UPDATE "sotd_mark" SET "event_id" = "solve"."event_id", "seq" = nextval('sync_seq') FROM "solve" WHERE "solve"."user_id" = "sotd_mark"."user_id" AND "solve"."id" = "sotd_mark"."solve_id";--> statement-breakpoint
DELETE FROM "sotd_mark" WHERE "event_id" IS NULL;--> statement-breakpoint
ALTER TABLE "sotd_mark" ALTER COLUMN "event_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sotd_mark" DROP CONSTRAINT "sotd_mark_user_id_date_pk";--> statement-breakpoint
ALTER TABLE "sotd_mark" ADD CONSTRAINT "sotd_mark_user_id_event_id_date_pk" PRIMARY KEY("user_id","event_id","date");
