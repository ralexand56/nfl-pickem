// scripts/fix-tiebreakers-constraint.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

async function fixTiebreakersConstraint() {
  console.log("Fixing weekly_tiebreakers table constraint...");

  try {
    // Drop the old index if it exists
    await sql`DROP INDEX IF EXISTS weekly_tiebreakers_user_season_week_unique`;
    console.log("✓ Dropped old index (if existed)");

    // Add unique constraint
    await sql`ALTER TABLE weekly_tiebreakers ADD CONSTRAINT weekly_tiebreakers_user_season_week_unique UNIQUE (user_id, season, week)`;
    console.log("✓ Added unique constraint");

    console.log("\nDone! Weekly tiebreakers constraint fixed.");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("✓ Constraint already exists, skipping.");
    } else {
      console.error("Error:", error);
      throw error;
    }
  }
}

fixTiebreakersConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
