// lib/server/syncScoresMinimal.ts
import "server-only";
import { db } from "@/db";
import { games } from "@/db/schema";
import { and, eq, ne, inArray } from "drizzle-orm";
import { fetchSeasonEvents } from "@/lib/sportsdb";

type SportsDbEvent = {
  idEvent: string;
  intRound?: string | null; // week
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null; // "FT", "Live", "Not Started", ...
};

const toInt = (x?: string | null) =>
  Number.isFinite(Number(x)) ? Number(x) : null;

const mapStatus = (
  s?: string | null
): "scheduled" | "in_progress" | "final" | "postponed" => {
  if (!s) return "scheduled";
  const t = s.toLowerCase();
  if (t.includes("ft") || t.includes("final")) return "final";
  if (t.includes("postponed")) return "postponed";
  if (t.includes("live") || t.includes("in play") || t.includes("in progress"))
    return "in_progress";
  return "scheduled";
};

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
  // 1. Fetch ALL events from API
  const schedule: SportsDbEvent[] = await fetchSeasonEvents(seasonYear, {
    noStore: force,
  });
  const apiEvents = Number.isFinite(week)
    ? schedule.filter((e) => Number(e.intRound ?? 0) === week)
    : schedule;

  // 2. Filter API events to only those that are FINAL
  const finalApiEvents = apiEvents.filter(
    (e) => mapStatus(e.strStatus) === "final"
  );

  if (finalApiEvents.length === 0) {
    return { ok: true, updates: 0, skipped: 0, missing: 0, scanned: 0 };
  }

  // 3. Get game IDs that are final in API
  const finalGameIds = finalApiEvents.map((e) => e.idEvent);

  // 4. Get games from database that are NOT already final
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

  // 5. Create lookup map
  const gameMap = new Map(nonFinalGamesInDb.map((g) => [g.id, g]));

  // 6. Process only final API events that have non-final games in DB
  const eventsToUpdate = finalApiEvents.filter((e) => gameMap.has(e.idEvent));

  let updates = 0,
    skipped = 0;

  for (const e of eventsToUpdate) {
    const id = e.idEvent;
    const home = toInt(e.intHomeScore);
    const away = toInt(e.intAwayScore);

    const current = gameMap.get(id)!; // We know it exists

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
      .where(and(eq(games.id, id), eq(games.season, seasonYear)));

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
