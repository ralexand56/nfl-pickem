import { sql } from "@vercel/postgres";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

async function createMeyersGame() {
  try {
    console.log("Creating Meyer's Super Bowl Party game...");

    await sql`
      INSERT INTO super_bowl_squares_config (game_id, season, home_team, away_team, price_per_square, is_locked)
      VALUES ('meyers-superbowl-party', 2026, 'TBD', 'TBD', 3.5, false)
    `;

    console.log("✅ Created Meyer's Super Bowl Party game!");
    console.log("   Game ID: meyers-superbowl-party");
    console.log("   Price per square: $3.50");
    console.log("   Total pot: $350");
    console.log("   URL: /squares/meyers-superbowl-party");
  } catch (error) {
    console.error("❌ Failed to create game:", error);
    throw error;
  }
}

createMeyersGame();
