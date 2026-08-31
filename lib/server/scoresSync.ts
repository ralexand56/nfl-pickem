// lib/server/scoresSync.ts
import "server-only";
import { db } from "@/db";
import { games } from "@/db/schema";
import { fetchWeekEvents, normalizeEspnEvent } from "@/lib/espn";

// App weeks 1-18 (regular season) + 19-22 (playoffs), used when no specific
// week is requested (i.e. "sync the whole season").
const ALL_WEEKS = Array.from({ length: 22 }, (_, i) => i + 1);

export async function syncScores({
  seasonYear,
  week, // optional: only upsert this week
  force = false, // if true, no throttle + fresh fetch
  onlyTouchMeaningful = true,
}: {
  seasonYear: number;
  week?: number;
  force?: boolean;
  onlyTouchMeaningful?: boolean;
}) {
  const weeks = week != null ? [week] : ALL_WEEKS;

  let upserts = 0;
  let scanned = 0;

  for (const wk of weeks) {
    const events = await fetchWeekEvents(seasonYear, wk, { noStore: force });
    if (events.length === 0) continue;

    // Sort by date to find the last game of the week for tiebreaker detection
    const sorted = [...events].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastGameId = sorted[0]?.id ?? null;

    for (const event of events) {
      scanned++;
      const g = normalizeEspnEvent(event, wk);
      const isTiebreaker = event.id === lastGameId;

      if (
        onlyTouchMeaningful &&
        g.homeScore == null &&
        g.awayScore == null &&
        g.status === "scheduled"
      )
        continue;

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
            date: g.date,
            homeTeam: g.homeTeam,
            awayTeam: g.awayTeam,
            status: g.status,
            homeScore: g.homeScore,
            awayScore: g.awayScore,
            isMondayNight: g.isMondayNight,
            isTiebreaker,
          },
        });

      upserts++;
    }
  }

  return { ok: true, upserts, scanned };
}
