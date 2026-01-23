import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import SquaresAdmin from "./squares-admin";

const CURRENT_SEASON = 2026;

export default async function AdminSquaresPage() {
  await requireSession();

  let config = await db
    .select()
    .from(superBowlSquaresConfig)
    .where(eq(superBowlSquaresConfig.season, CURRENT_SEASON))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config) {
    // Create default config
    await db.insert(superBowlSquaresConfig).values({
      season: CURRENT_SEASON,
      homeTeam: "TBD",
      awayTeam: "TBD",
      pricePerSquare: 5,
      isLocked: false,
    });

    config = await db
      .select()
      .from(superBowlSquaresConfig)
      .where(eq(superBowlSquaresConfig.season, CURRENT_SEASON))
      .limit(1)
      .then((rows) => rows[0]);
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Admin: Super Bowl Squares</h1>
      <SquaresAdmin config={config} season={CURRENT_SEASON} />
    </main>
  );
}
