import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { fetchWeekEvents, normalizeGame } from "@/lib/sportsdb";

export async function POST(req: Request) {
  const { season, week } = await req.json();
  const events = await fetchWeekEvents(season, week);
  for (const e of events) {
    const g = normalizeGame(e);
    await db
      .insert(games)
      .values({
        id: g.id,
        season: g.season,
        week: g.week,
        date: new Date(g.date),
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        status: g.status,
        homeScore: g.homeScore ?? null,
        awayScore: g.awayScore ?? null,
        isMondayNight: g.isMondayNight ?? false,
      })
      .onConflictDoUpdate({
        target: games.id,
        set: {
          season: g.season,
          week: g.week,
          date: new Date(g.date),
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          status: g.status,
          homeScore: g.homeScore ?? null,
          awayScore: g.awayScore ?? null,
          isMondayNight: g.isMondayNight ?? false,
        },
      });
  }
  return NextResponse.json({ count: events.length });
}
