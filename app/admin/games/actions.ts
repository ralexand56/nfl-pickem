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

  // For checkboxes, we need to check if they're checked or not
  // If the checkbox is checked, the value is "true", otherwise it's not in formData
  const isMondayNight = formData.get("isMondayNight") === "true";
  const isTiebreaker = formData.get("isTiebreaker") === "true";

  const homeScore = homeScoreRaw && homeScoreRaw !== "" ? Number(homeScoreRaw) : null;
  const awayScore = awayScoreRaw && awayScoreRaw !== "" ? Number(awayScoreRaw) : null;

  // Validate that season and week are valid numbers
  if (isNaN(season) || isNaN(week)) {
    throw new Error("Invalid season or week");
  }

  console.log("Updating game:", {
    gameId,
    status,
    homeScore,
    awayScore,
    homeTeam,
    awayTeam,
  });

  const result = await db
    .update(games)
    .set({
      date: new Date(date),
      homeTeam,
      awayTeam,
      status,
      homeScore,
      awayScore,
      isMondayNight,
      isTiebreaker,
    })
    .where(eq(games.id, gameId))
    .returning();

  console.log("Game updated successfully:", result);

  revalidatePath(`/admin/games`);
  revalidatePath(`/week/${season}/${week}`);
  revalidatePath(`/week/${season}/${week}/leaderboard`);
}

