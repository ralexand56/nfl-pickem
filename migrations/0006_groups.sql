-- Multi-group support. Everything that existed before this migration belongs
-- to the original family group (slug 'alexander'), which is comped for every
-- season it has played. Run with scripts/migrate-groups.ts (one transaction).

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  invite_token text NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS group_members_user_idx ON group_members (user_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS group_seasons (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  season integer NOT NULL,
  status text NOT NULL CHECK (status IN ('paid', 'comped')),
  stripe_checkout_session_id text UNIQUE,
  paid_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, season)
);
--> statement-breakpoint

-- The original family group.
INSERT INTO groups (slug, name, invite_token)
VALUES ('alexander', 'Alexander Family', replace(gen_random_uuid()::text, '-', ''))
ON CONFLICT (slug) DO NOTHING;
--> statement-breakpoint
INSERT INTO group_members (group_id, user_id, role)
SELECT g.id, u.id,
  CASE WHEN lower(u.email) IN ('ralexand56@gmail.com', 'sydmichelle7@gmail.com')
    THEN 'admin' ELSE 'member' END
FROM groups g CROSS JOIN users u
WHERE g.slug = 'alexander'
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO group_seasons (group_id, season, status)
SELECT g.id, s.season, 'comped'
FROM groups g
CROSS JOIN (
  SELECT DISTINCT season FROM games
  UNION SELECT 2026
) s
WHERE g.slug = 'alexander'
ON CONFLICT DO NOTHING;
--> statement-breakpoint

-- group_id on every per-group table, backfilled to the family group.
ALTER TABLE picks ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE weekly_tiebreakers ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE weekly_payments ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE super_bowl_squares ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE super_bowl_squares_config ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
--> statement-breakpoint
UPDATE picks SET group_id = (SELECT id FROM groups WHERE slug = 'alexander') WHERE group_id IS NULL;
--> statement-breakpoint
UPDATE weekly_tiebreakers SET group_id = (SELECT id FROM groups WHERE slug = 'alexander') WHERE group_id IS NULL;
--> statement-breakpoint
UPDATE weekly_payments SET group_id = (SELECT id FROM groups WHERE slug = 'alexander') WHERE group_id IS NULL;
--> statement-breakpoint
UPDATE super_bowl_squares SET group_id = (SELECT id FROM groups WHERE slug = 'alexander') WHERE group_id IS NULL;
--> statement-breakpoint
UPDATE super_bowl_squares_config SET group_id = (SELECT id FROM groups WHERE slug = 'alexander') WHERE group_id IS NULL;
--> statement-breakpoint
ALTER TABLE picks ALTER COLUMN group_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE weekly_tiebreakers ALTER COLUMN group_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE weekly_payments ALTER COLUMN group_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE super_bowl_squares ALTER COLUMN group_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE super_bowl_squares_config ALTER COLUMN group_id SET NOT NULL;
--> statement-breakpoint

-- Unique keys now include group_id, so one person can play in several
-- groups. Old names came from both drizzle push and the hand-written
-- scripts/fix-*-constraint.ts, so drop every variant that may exist.
ALTER TABLE picks DROP CONSTRAINT IF EXISTS picks_user_game_unique;
--> statement-breakpoint
DROP INDEX IF EXISTS picks_user_game_unique;
--> statement-breakpoint
ALTER TABLE picks ADD CONSTRAINT picks_group_user_game_unique UNIQUE (group_id, user_id, game_id);
--> statement-breakpoint
ALTER TABLE weekly_tiebreakers DROP CONSTRAINT IF EXISTS weekly_tiebreakers_user_season_week_unique;
--> statement-breakpoint
DROP INDEX IF EXISTS weekly_tiebreakers_user_season_week_unique;
--> statement-breakpoint
ALTER TABLE weekly_tiebreakers DROP CONSTRAINT IF EXISTS uniq_user_season_week;
--> statement-breakpoint
DROP INDEX IF EXISTS uniq_user_season_week;
--> statement-breakpoint
ALTER TABLE weekly_tiebreakers ADD CONSTRAINT weekly_tiebreakers_group_user_season_week_unique UNIQUE (group_id, user_id, season, week);
--> statement-breakpoint
ALTER TABLE weekly_payments DROP CONSTRAINT IF EXISTS weekly_payments_user_season_week_unique;
--> statement-breakpoint
ALTER TABLE weekly_payments ADD CONSTRAINT weekly_payments_group_user_season_week_unique UNIQUE (group_id, user_id, season, week);
--> statement-breakpoint
ALTER TABLE super_bowl_squares DROP CONSTRAINT IF EXISTS squares_row_col_game_unique;
--> statement-breakpoint
DROP INDEX IF EXISTS squares_row_col_game_unique;
--> statement-breakpoint
ALTER TABLE super_bowl_squares ADD CONSTRAINT squares_group_game_row_col_unique UNIQUE (group_id, game_id, row, col);
--> statement-breakpoint
ALTER TABLE super_bowl_squares_config DROP CONSTRAINT IF EXISTS super_bowl_squares_config_game_id_unique;
--> statement-breakpoint
ALTER TABLE super_bowl_squares_config ADD CONSTRAINT squares_config_group_game_unique UNIQUE (group_id, game_id);
