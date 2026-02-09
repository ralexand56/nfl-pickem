"use server";

import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateConfigAction(
  season: number,
  homeTeam: string,
  awayTeam: string,
  pricePerSquare: number
): Promise<void> {
  await requireSession();

  await db
    .update(superBowlSquaresConfig)
    .set({
      homeTeam,
      awayTeam,
      pricePerSquare,
    })
    .where(eq(superBowlSquaresConfig.season, season));

  revalidatePath("/admin/squares");
  revalidatePath("/squares");
}

export async function generateNumbersAction(season: number): Promise<void> {
  await requireSession();

  // Generate two random arrays of [0,1,2,3,4,5,6,7,8,9] shuffled
  function shuffleArray(): number[] {
    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const homeNumbers = shuffleArray();
  const awayNumbers = shuffleArray();

  await db
    .update(superBowlSquaresConfig)
    .set({
      homeNumbers: JSON.stringify(homeNumbers),
      awayNumbers: JSON.stringify(awayNumbers),
    })
    .where(eq(superBowlSquaresConfig.season, season));

  revalidatePath("/admin/squares");
  revalidatePath("/squares");
}

export async function lockBoardAction(season: number): Promise<void> {
  await requireSession();

  await db
    .update(superBowlSquaresConfig)
    .set({
      isLocked: true,
    })
    .where(eq(superBowlSquaresConfig.season, season));

  revalidatePath("/admin/squares");
  revalidatePath("/squares");
}

export async function unlockBoardAction(season: number): Promise<void> {
  await requireSession();

  await db
    .update(superBowlSquaresConfig)
    .set({
      isLocked: false,
    })
    .where(eq(superBowlSquaresConfig.season, season));

  revalidatePath("/admin/squares");
  revalidatePath("/squares");
}
