import { db } from "@/db";
import { games, picks, weeklyTiebreakers, users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import PicksClient from "./picks-client";

export default async function WeekPage({
  params,
}: {
  params: { season: string; week: string };
}) {
  const { season, week } = await params;
  const seasonNumber = Number(season);
  const weekNumber = Number(week);
  try {
    const gs = await db
      .select()
      .from(games)
      .where(and(eq(games.season, seasonNumber), eq(games.week, weekNumber)));

    const allPicks = await db
      .select()
      .from(picks)
      .innerJoin(users, eq(picks.userId, users.id))
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
          eq(weeklyTiebreakers.season, seasonNumber),
          eq(weeklyTiebreakers.week, weekNumber)
        )
      );

    return (
      <PicksClient
        games={gs}
        allPicks={allPicks}
        tiebreakers={tbs}
        season={seasonNumber}
        week={weekNumber}
      />
    );
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}
