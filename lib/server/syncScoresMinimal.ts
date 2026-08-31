// lib/server/syncScoresMinimal.ts
import "server-only";
import { db } from "@/db";
import { games } from "@/db/schema";
import { and, eq, ne, inArray } from "drizzle-orm";
import { fetchWeekEvents, mapEspnStatus, type EspnEvent } from "@/lib/espn";

// App weeks 1-18 (regular season) + 19-22 (playoffs), used when no specific
// week is requested (i.e. "sync the whole season").
const ALL_WEEKS = Array.from({ length: 22 }, (_, i) => i + 1);

const toInt = (x?: string | null) =>
  x != null && Number.isFinite(Number(x)) ? Number(x) : null;

async function fetchEventsForWeeks(
  seasonYear: number,
  weeks: number[],
  force: boolean
): Promise<EspnEvent[]> {
  const perWeek = await Promise.all(
    weeks.map((week) => fetchWeekEvents(seasonYear, week, { noStore: force }))
  );
  return perWeek.flat();
}

/**
 * Update ONLY status, homeScore, awayScore for games that are final in the API.
 * Skip games that are already final in our database.
 */
export async function syncScoresMinimal({
  seasonYear,
  week,
  force = false,
}: {
  seasonYear: number;
  week?: number;
  force?: boolean;
}) {
  const weeks = week != null ? [week] : ALL_WEEKS;
  const apiEvents = await fetchEventsForWeeks(seasonYear, weeks, force);

  // Filter API events to only those that are FINAL
  const finalApiEvents = apiEvents.filter((e) => mapEspnStatus(e) === "final");

  if (finalApiEvents.length === 0) {
    return { ok: true, updates: 0, skipped: 0, missing: 0, scanned: 0 };
  }

  // Get game IDs that are final in API
  const finalGameIds = finalApiEvents.map((e) => e.id);

  // Get games from database that are NOT already final
  const nonFinalGamesInDb = await db
    .select({
      id: games.id,
      status: games.status,
      homeScore: games.homeScore,
      awayScore: games.awayScore,
    })
    .from(games)
    .where(
      and(
        eq(games.season, seasonYear),
        inArray(games.id, finalGameIds),
        ne(games.status, "final") // Only get games that aren't already final
      )
    );

  // Create lookup map
  const gameMap = new Map(nonFinalGamesInDb.map((g) => [g.id, g]));

  // Process only final API events that have non-final games in DB
  const eventsToUpdate = finalApiEvents.filter((e) => gameMap.has(e.id));

  let updates = 0,
    skipped = 0;

  for (const e of eventsToUpdate) {
    const competitors = e.competitions?.[0]?.competitors ?? [];
    const home = toInt(competitors.find((c) => c.homeAway === "home")?.score);
    const away = toInt(competitors.find((c) => c.homeAway === "away")?.score);

    const current = gameMap.get(e.id)!; // We know it exists

    const unchanged =
      (current.homeScore ?? null) === home &&
      (current.awayScore ?? null) === away;

    if (unchanged) {
      skipped++;
      continue;
    }

    // Update to final status with scores
    await db
      .update(games)
      .set({
        status: "final",
        homeScore: home,
        awayScore: away,
      })
      .where(and(eq(games.id, e.id), eq(games.season, seasonYear)));

    updates++;
  }

  const alreadyFinal = finalApiEvents.length - eventsToUpdate.length;
  const missing = finalGameIds.length - nonFinalGamesInDb.length - alreadyFinal;

  return {
    ok: true,
    updates,
    skipped,
    missing,
    alreadyFinal,
    scanned: eventsToUpdate.length,
  };
}
