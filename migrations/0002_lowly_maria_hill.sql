ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailVerified" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "created_at";