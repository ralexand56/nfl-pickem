// lib/server/currentWeek.ts
import "server-only";
import { toAppWeek } from "@/lib/espn";

// Free ESPN API (unofficial). ESPN's own postseason week numbers (1-5) don't
// match this app's numbering (1-18 regular season, 19-22 playoffs, verified
// live against the API - see lib/espn.ts), so the response is translated via
// toAppWeek before returning. Returns null during preseason (no app week yet).
export async function getCurrentNflWeek(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const seasonType = data?.season?.type;
    const espnWeek = data?.week?.number;
    if (seasonType == null || espnWeek == null) return null;
    return toAppWeek(seasonType, espnWeek);
  } catch {
    return null;
  }
}
