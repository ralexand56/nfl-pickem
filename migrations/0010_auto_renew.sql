-- Optional automatic renewal through a Stripe subscription (opt-in at
-- checkout). auto_renew mirrors the subscription: on while it's active and
-- not set to cancel.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE groups ADD COLUMN IF NOT EXISTS stripe_customer_id text;
--> statement-breakpoint
ALTER TABLE groups ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;
--> statement-breakpoint
-- Next renewal date, for the admin page and the reminder email.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS renews_at timestamptz;
--> statement-breakpoint
-- Season whose renewal reminder was already emailed (California's
-- auto-renewal law requires a notice before each yearly charge).
ALTER TABLE groups ADD COLUMN IF NOT EXISTS renewal_reminder_season integer;
--> statement-breakpoint
-- Seasons paid by an automatic renewal record the Stripe invoice instead of
-- a Checkout Session; unique so a replayed webhook can't double-record.
ALTER TABLE group_seasons ADD COLUMN IF NOT EXISTS stripe_invoice_id text UNIQUE;
