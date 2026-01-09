import { NextResponse } from "next/server";
import { db } from "@/db";
import { games } from "@/db/schema";
import { fetchWeekEvents, normalizeGame, SportsDbEvent } from "@/lib/sportsdb";

export async function POST(req: Request) {
  try {
    const { season, week } = await req.json();

    const events = await fetchWeekEvents(season, week);

    // Sort events by date to find the last game
    const sortedEvents = events.sort((a: SportsDbEvent, b: SportsDbEvent) => {
      const dateA = new Date(a.dateEvent + 'T' + a.strTime).getTime();
      const dateB = new Date(b.dateEvent + 'T' + b.strTime).getTime();
      return dateB - dateA;
    });

    const lastGameId = sortedEvents.length > 0 ? sortedEvents[0].idEvent : null;

    for (const e of events) {
      const g = normalizeGame(e);
      const isTiebreaker = e.idEvent === lastGameId;

      await db
        .insert(games)
        .values({
          ...g,
          isTiebreaker,
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
            isTiebreaker,
          },
        });
    }
    return NextResponse.json({ count: events.length });
  } catch (error) {
    console.error('API Error:', error);
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Failed to sync week data', details },
      { status: 500 }
    );
  }
}