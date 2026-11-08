-- Automatic pick reminders: one row per member per lock they were reminded
-- about (so overlapping scheduler runs can't double-send), and a per-member
-- opt-out set from the link in the email.
ALTER TABLE group_members
  ADD COLUMN IF NOT EXISTS auto_reminders_off boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS auto_pick_reminders (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lock_at timestamptz NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id, lock_at)
);
