-- Where the group's buyer first came from (search engine, campaign, referral
-- or direct), copied from the Stripe Checkout Session metadata.
ALTER TABLE groups ADD COLUMN IF NOT EXISTS first_touch jsonb;
