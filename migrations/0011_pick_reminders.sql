-- When an admin last reminded a member about a week's picks, so nobody gets
-- reminded repeatedly.
CREATE TABLE IF NOT EXISTS pick_reminders (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season integer NOT NULL,
  week integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id, season, week)
);
