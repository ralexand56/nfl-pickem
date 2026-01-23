// lib/server/currentWeek.ts
import "server-only";

// Free ESPN example (unofficial)
export async function getCurrentNflWeek(): Promise<number | null> {
  // HARDCODED: Conference Championships (Jan 25, 2026)
  // Update this manually as playoffs progress:
  // - Week 19: Wild Card (Jan 10-12)
  // - Week 20: Divisional (Jan 17-18)
  // - Week 21: Conference Championships (Jan 25)
  // - Week 22: Super Bowl (Feb 9)
  return 21;

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
