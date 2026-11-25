CREATE TABLE "wca_live_competition" (
	"competition_id" text PRIMARY KEY NOT NULL,
	"live_id" text,
	"schedule" jsonb,
	"assignments" jsonb,
	"entered_at" jsonb,
	"fetched_at" timestamp with time zone NOT NULL,
	"final" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wca_live_competition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "time_zone" text;