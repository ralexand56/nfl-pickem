// scripts/delete-future-playoff-games.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { games } from "../db/schema";
import { and, eq, gte } from "drizzle-orm";

async function deleteFuturePlayoffGames() {
  console.log("Deleting placeholder games for weeks 20-22...");

  try {
    const result = await db
      .delete(games)
      .where(
        and(
          eq(games.season, 2026),
          gte(games.week, 20) // Delete weeks 20, 21, 22
        )
      );

    console.log("✓ Deleted future playoff games (weeks 20-22)");
    console.log("\nThese will be added after Wild Card results are known.");
  } catch (error) {
    console.error("Error deleting games:", error);
  }
}

deleteFuturePlayoffGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
