// Public NFL schedule data for the printable weekly pick sheets. Reads only
// the shared games table (no group data).
import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { games } from "@/db/schema";

export async function getSeasonWeeks(season: number) {
  const rows = await db
    .selectDistinct({ week: games.week })
    .from(games)
    .where(eq(games.season, season))
    .orderBy(asc(games.week));
  return rows.map((r) => r.week);
}

export async function getWeekGames(season: number, week: number) {
  return db
    .select({
      id: games.id,
      date: games.date,
      homeTeam: games.homeTeam,
      awayTeam: games.awayTeam,
      isTiebreaker: games.isTiebreaker,
    })
    .from(games)
    .where(and(eq(games.season, season), eq(games.week, week)))
    .orderBy(asc(games.date));
}

// Kickoffs shown in Eastern time, as NFL schedules are published.
export function kickoffLabel(date: Date) {
  const day = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  return { day, time: `${time} ET` };
}
