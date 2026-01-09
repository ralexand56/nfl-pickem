"use server";

import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateGameAction(formData: FormData): Promise<void> {
  await requireSession(); // Ensure user is authenticated
  
  const gameId = formData.get("gameId") as string;
  const season = Number(formData.get("season"));
  const week = Number(formData.get("week"));
  const date = formData.get("date") as string;
  const homeTeam = formData.get("homeTeam") as string;
  const awayTeam = formData.get("awayTeam") as string;
  const status = formData.get("status") as string;
  const homeScoreRaw = formData.get("homeScore");
  const awayScoreRaw = formData.get("awayScore");
  const isMondayNight = formData.get("isMondayNight") === "true";
  const isTiebreaker = formData.get("isTiebreaker") === "true";

  const homeScore = homeScoreRaw && homeScoreRaw !== "" ? Number(homeScoreRaw) : null;
  const awayScore = awayScoreRaw && awayScoreRaw !== "" ? Number(awayScoreRaw) : null;

  await db
    .update(games)
    .set({
      season,
      week,
      date: new Date(date),
      homeTeam,
      awayTeam,
      status,
      homeScore,
      awayScore,
      isMondayNight,
      isTiebreaker,
    })
    .where(eq(games.id, gameId));

  revalidatePath(`/admin/games`);
  revalidatePath(`/week/${season}/${week}`);
}

