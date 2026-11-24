CREATE TABLE "wca_competition" (
	"id" text PRIMARY KEY NOT NULL,
	"wcif" jsonb,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wca_competition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wca_person" (
	"wca_id" text PRIMARY KEY NOT NULL,
	"results" jsonb,
	"results_fetched_at" timestamp with time zone,
	"competitions" jsonb,
	"competitions_fetched_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "wca_person" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wca_scrambles" (
	"competition_id" text PRIMARY KEY NOT NULL,
	"scrambles" jsonb NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wca_scrambles" ENABLE ROW LEVEL SECURITY;