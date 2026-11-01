-- Groups that never pay (the original family group). Set only by migration,
-- never from the app, so no admin can grant it to their own group.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS comped_forever boolean NOT NULL DEFAULT false;
--> statement-breakpoint
UPDATE groups SET comped_forever = true WHERE slug = 'alexander';
