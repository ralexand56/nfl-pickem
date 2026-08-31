// lib/server/currentWeek.ts
import "server-only";
import { toAppWeek } from "@/lib/espn";

export type CurrentNfl = { week: number | null; season: number | null };

// Free ESPN API (unofficial). ESPN's own postseason week numbers (1-5) don't
// match this app's numbering (1-18 regular season, 19-22 playoffs, verified
// live against the API - see lib/espn.ts), so the week is translated via
// toAppWeek. ESPN labels a season (including its playoffs, which fall in the
// following calendar year) by its start year, and this app now follows that
// same convention throughout - see the games.season column.
export async function getCurrentNfl(): Promise<CurrentNfl> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return { week: null, season: null };
    const data = await res.json();
    const seasonType = data?.season?.type;
    const espnWeek = data?.week?.number;
    const season = data?.season?.year ?? null;
    const week =
      seasonType != null && espnWeek != null
        ? toAppWeek(seasonType, espnWeek)
        : null;
    return { week, season };
  } catch {
    return { week: null, season: null };
  }
}

// Back-compat helper for callers that only need the week.
export async function getCurrentNflWeek(): Promise<number | null> {
  return (await getCurrentNfl()).week;
}
