-- Manual migration script to create user_site_access table
-- This ensures the table is created even if Drizzle migration system doesn't detect it

CREATE TABLE IF NOT EXISTS "user_site_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"site_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid
);

DO $$ BEGIN
 ALTER TABLE "user_site_access" ADD CONSTRAINT "user_site_access_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_site_access" ADD CONSTRAINT "user_site_access_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "user_site_access" ADD CONSTRAINT "user_site_access_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "user_site_access_user_id_idx" ON "user_site_access"("user_id");
CREATE INDEX IF NOT EXISTS "user_site_access_site_id_idx" ON "user_site_access"("site_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_site_access_user_id_site_id_unique" ON "user_site_access"("user_id", "site_id");
