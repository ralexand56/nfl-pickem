// scripts/fix-picks-constraint.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.POSTGRES_URL!);

async function fixPicksConstraint() {
  console.log("Fixing picks table constraint...");

  try {
    // Drop the old index
    await sql`DROP INDEX IF EXISTS picks_user_game_unique`;
    console.log("✓ Dropped old index");

    // Add unique constraint
    await sql`ALTER TABLE picks ADD CONSTRAINT picks_user_game_unique UNIQUE (user_id, game_id)`;
    console.log("✓ Added unique constraint");

    console.log("\nDone! Picks constraint fixed.");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      console.log("✓ Constraint already exists, skipping.");
    } else {
      console.error("Error:", error);
      throw error;
    }
  }
}

fixPicksConstraint()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
