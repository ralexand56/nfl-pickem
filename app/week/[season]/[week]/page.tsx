import { db } from "@/db";
import { games, picks, weeklyTiebreakers } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import PicksClient from "./picks-client";

export default async function WeekPage({
  params,
}: {
  params: { season: string; week: string };
}) {
  const season = Number(await params.season);
  const week = Number(await params.week);

  try {
    const gs = await db
      .select()
      .from(games)
      .where(and(eq(games.season, season), eq(games.week, week)));

    const allPicks = await db
      .select()
      .from(picks)
      .where(
        inArray(
          picks.gameId,
          gs.map((g) => g.id)
        )
      );

    const tbs = await db
      .select()
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.season, season),
          eq(weeklyTiebreakers.week, week)
        )
      );

    return (
      <PicksClient
        games={gs}
        allPicks={allPicks}
        tiebreakers={tbs}
        season={season}
        week={week}
      />
    );
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}
