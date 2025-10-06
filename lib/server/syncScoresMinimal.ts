// lib/server/syncScoresMinimal.ts
import "server-only";
import { db } from "@/db";
import { games } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
 * Update ONLY status, homeScore, awayScore for rows that already exist.
 * - seasonLabel: "2025-2026" (SportsDB)
 * - seasonYear: 2025 (your DB season)
 * - week: optional filter to reduce work (recommended)
 * - force: fetch with cache: 'no-store' (for admin refresh)
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
  const schedule: SportsDbEvent[] = await fetchSeasonEvents(seasonYear, {
    noStore: force,
  });
  console.log({schedule})
  const rows = Number.isFinite(week)
    ? schedule.filter((e) => Number(e.intRound ?? 0) === week)
    : schedule;

  let updates = 0,
    skipped = 0,
    missing = 0;

  for (const e of rows) {
    const id = e.idEvent;
    const status = mapStatus(e.strStatus);
    const home = toInt(e.intHomeScore);
    const away = toInt(e.intAwayScore);

    // Read current values so we only write if something changed
    const [current] = await db
      .select({
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
      })
      .from(games)
      .where(and(eq(games.id, id), eq(games.season, seasonYear)));

    if (!current) {
      // Row doesn't exist in your DB — per your request we do NOT insert.
      // (If you want optional insert, I can add a flag to do an upsert.)
      missing++;
      continue;
    }

    const unchanged =
      (current.status ?? "scheduled") === status &&
      (current.homeScore ?? null) === home &&
      (current.awayScore ?? null) === away;

    if (unchanged) {
      skipped++;
      continue;
    }

    await db
      .update(games)
      .set({
        status,
        homeScore: home, // can be null if provider omits score
        awayScore: away, // "
      })
      .where(and(eq(games.id, id), eq(games.season, seasonYear)));

    updates++;
  }

  return { ok: true, updates, skipped, missing, scanned: rows.length };
}
