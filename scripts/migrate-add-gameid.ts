import { config } from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables
config({ path: ".env.local" });

async function migrate() {
  try {
    console.log("Starting migration to add gameId...");

    // Add gameId column to super_bowl_squares with default value
    await sql`
      ALTER TABLE super_bowl_squares
      ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'default'
    `;
    console.log("✓ Added game_id column to super_bowl_squares");

    // Drop old unique index if it exists
    await sql`
      DROP INDEX IF EXISTS squares_row_col_season_unique
    `;
    console.log("✓ Dropped old unique index");

    // Create new unique index on row, col, game_id
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS squares_row_col_game_unique
      ON super_bowl_squares(row, col, game_id)
    `;
    console.log("✓ Created new unique index on (row, col, game_id)");

    // Add gameId column to super_bowl_squares_config
    await sql`
      ALTER TABLE super_bowl_squares_config
      ADD COLUMN IF NOT EXISTS game_id TEXT NOT NULL DEFAULT 'default'
    `;
    console.log("✓ Added game_id column to super_bowl_squares_config");

    // Add createdAt column to super_bowl_squares_config
    await sql`
      ALTER TABLE super_bowl_squares_config
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()
    `;
    console.log("✓ Added created_at column to super_bowl_squares_config");

    // Drop unique constraint on season
    await sql`
      ALTER TABLE super_bowl_squares_config
      DROP CONSTRAINT IF EXISTS super_bowl_squares_config_season_unique
    `;
    console.log("✓ Dropped unique constraint on season");

    // Add unique constraint on gameId
    await sql`
      ALTER TABLE super_bowl_squares_config
      ADD CONSTRAINT super_bowl_squares_config_game_id_unique UNIQUE (game_id)
    `;
    console.log("✓ Added unique constraint on game_id");

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

migrate();
