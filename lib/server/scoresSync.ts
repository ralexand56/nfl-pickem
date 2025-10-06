// lib/server/scoresSync.ts
import "server-only";
import { db } from "@/db";
import { games } from "@/db/schema";
import { fetchSeasonEvents } from "@/lib/sportsdb";
import { sql, and, eq } from "drizzle-orm"; // adjust imports if needed

type SportsDbEvent = {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intRound?: string | null;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strStatus?: string | null;
  strVenue?: string | null;
};

const toInt = (x?: string | null, d = 0) =>
  Number.isFinite(Number(x)) ? Number(x) : d;
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
const isMNF = (ts?: string | null, d?: string | null) => {
  const iso = ts ?? (d ? `${d}T00:00:00Z` : null);
  if (!iso) return false;
  const east = new Date(
    new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  return east.getDay() === 1 && east.getHours() >= 20;
};

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
  const schedule: SportsDbEvent[] = await fetchSeasonEvents(seasonYear, {
    noStore: force,
  });
  const rows = Number.isFinite(week)
    ? schedule.filter((e) => toInt(e.intRound) === week)
    : schedule;

  let upserts = 0;
  for (const e of rows) {
    const wk = toInt(e.intRound, 0);
    const status = mapStatus(e.strStatus);
    const hScore = e.intHomeScore != null ? toInt(e.intHomeScore) : null;
    const aScore = e.intAwayScore != null ? toInt(e.intAwayScore) : null;
    const kickoff =
      e.strTimestamp ?? (e.dateEvent ? `${e.dateEvent}T00:00:00Z` : null);

    if (
      onlyTouchMeaningful &&
      hScore == null &&
      aScore == null &&
      status === "scheduled"
    )
      continue;

    await db
      .insert(games)
      .values({
        id: e.idEvent,
        season: seasonYear,
        week: wk,
        date: kickoff ? new Date(kickoff) : new Date(),
        homeTeam: e.strHomeTeam,
        awayTeam: e.strAwayTeam,
        status,
        homeScore: hScore,
        awayScore: aScore,
        isMondayNight: isMNF(e.strTimestamp, e.dateEvent),
      })
      .onConflictDoUpdate({
        target: games.id,
        set: {
          season: seasonYear,
          week: wk,
          date: kickoff ? new Date(kickoff) : new Date(),
          homeTeam: e.strHomeTeam,
          awayTeam: e.strAwayTeam,
          status,
          homeScore: hScore,
          awayScore: aScore,
          isMondayNight: isMNF(e.strTimestamp, e.dateEvent),
        },
      });

    upserts++;
  }

  return { ok: true, upserts, scanned: rows.length };
}
