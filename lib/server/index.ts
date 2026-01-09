// lib/server/currentWeek.ts
import "server-only";

// Free ESPN example (unofficial)
export async function getCurrentNflWeek(): Promise<number | null> {
  // HARDCODED: Wild Card weekend (Jan 10-12, 2026)
  // Update this manually as playoffs progress:
  // - Week 19: Wild Card (Jan 10-12)
  // - Week 20: Divisional (Jan 18-19)
  // - Week 21: Conference (Jan 26)
  // - Week 22: Super Bowl (Feb 9)
  return 19;

  /* eslint-disable-next-line no-unreachable */
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.week?.number ?? null;
  } catch {
    return null;
  }
}
