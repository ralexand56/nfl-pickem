import { db } from "@/db";
import { games } from "@/db/schema";
import { and, eq, asc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import GamesEditor from "./GamesEditor";

export const revalidate = 0;

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string; week?: string }>;
}) {
  await requireSession();

  const params = await searchParams;
  const season = params.season ? Number(params.season) : null;
  const week = params.week ? Number(params.week) : null;

  // Get available seasons and weeks
  const seasonWeekPairs = await db
    .select({
      season: games.season,
      week: games.week,
    })
    .from(games)
    .groupBy(games.season, games.week);

  const uniqueSeasons = Array.from(
    new Set(seasonWeekPairs.map((p) => p.season))
  ).sort((a, b) => b - a);

  const weeksForSeason = season
    ? Array.from(
        new Set(
          seasonWeekPairs
            .filter((p) => p.season === season)
            .map((p) => p.week)
        )
      ).sort((a, b) => a - b)
    : [];

  // Get games for selected week
  const weekGames =
    season && week
      ? await db
          .select()
          .from(games)
          .where(and(eq(games.season, season), eq(games.week, week)))
          .orderBy(asc(games.date))
      : [];

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin: Edit Games</h1>

      <GamesEditor
        seasons={uniqueSeasons}
        selectedSeason={season}
        selectedWeek={week}
        weeksForSeason={weeksForSeason}
        games={weekGames}
      />
    </main>
  );
}

