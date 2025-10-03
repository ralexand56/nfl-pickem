// lib/server/currentWeek.ts
import "server-only";

// Free ESPN example (unofficial)
export async function getCurrentNflWeek(): Promise<number | null> {
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
