// scripts/create-weekly-payments.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

async function createWeeklyPayments() {
  console.log("Creating weekly_payments table...");

  await sql`
    CREATE TABLE IF NOT EXISTS weekly_payments (
      id serial PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      season integer NOT NULL,
      week integer NOT NULL,
      paid boolean NOT NULL DEFAULT false,
      method text,
      updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
      updated_at timestamp with time zone DEFAULT now(),
      CONSTRAINT weekly_payments_user_season_week_unique UNIQUE (user_id, season, week)
    )
  `;
  // Added after the table was first created
  await sql`ALTER TABLE weekly_payments ADD COLUMN IF NOT EXISTS method text`;
  console.log("✓ weekly_payments table ready");
}

createWeeklyPayments()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
