-- When a user last agreed to the Terms of Service (and confirmed their age),
-- recorded when they start a group or join one.
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
--> statement-breakpoint
-- The family's real weekly buy-in.
UPDATE groups SET settings = settings || '{"buyInAmount": 10}'::jsonb WHERE slug = 'alexander';
