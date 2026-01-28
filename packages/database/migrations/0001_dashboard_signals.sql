ALTER TABLE "telemetry_events" ADD COLUMN IF NOT EXISTS "event_type" varchar(50) DEFAULT 'custom' NOT NULL;
ALTER TABLE "telemetry_events" ADD COLUMN IF NOT EXISTS "session_id" uuid;
ALTER TABLE "telemetry_events" ADD COLUMN IF NOT EXISTS "page" jsonb;
ALTER TABLE "telemetry_events" ADD COLUMN IF NOT EXISTS "search" jsonb;

CREATE INDEX IF NOT EXISTS "telemetry_events_site_id_timestamp_idx" ON "telemetry_events" ("site_id", "timestamp");
CREATE INDEX IF NOT EXISTS "telemetry_events_event_type_idx" ON "telemetry_events" ("event_type");
CREATE INDEX IF NOT EXISTS "telemetry_events_session_id_idx" ON "telemetry_events" ("session_id");

CREATE TABLE IF NOT EXISTS "content_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"url" varchar(1024) NOT NULL,
	"path" varchar(500),
	"title" text,
	"intent" varchar(100),
	"funnel_stage" varchar(100),
	"hash" text,
	"metadata" jsonb,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "coverage_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"missing_intents" jsonb,
	"missing_stages" jsonb,
	"gaps" jsonb,
	"confidence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "confusion_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"type" varchar(50) NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"evidence" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "authority_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"window_start" timestamp NOT NULL,
	"window_end" timestamp NOT NULL,
	"authority_score" integer DEFAULT 0 NOT NULL,
	"trust_signals" jsonb,
	"blockers" jsonb,
	"confidence" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "dashboard_rollups_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"day" timestamp NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	"page_views" integer DEFAULT 0 NOT NULL,
	"searches" integer DEFAULT 0 NOT NULL,
	"interactions" integer DEFAULT 0 NOT NULL,
	"top_pages" jsonb,
	"top_intents" jsonb,
	"metrics" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "content_inventory" ADD CONSTRAINT "content_inventory_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "coverage_signals" ADD CONSTRAINT "coverage_signals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "confusion_signals" ADD CONSTRAINT "confusion_signals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "authority_signals" ADD CONSTRAINT "authority_signals_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "dashboard_rollups_daily" ADD CONSTRAINT "dashboard_rollups_daily_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
