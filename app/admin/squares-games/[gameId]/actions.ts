"use server";

import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function updateConfigAction(
  gameId: string,
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
    .where(eq(superBowlSquaresConfig.gameId, gameId));

  revalidatePath(`/squares/${gameId}`);
  revalidatePath(`/admin/squares-games/${gameId}`);
  revalidatePath("/admin/squares-games");
}

export async function generateNumbersAction(gameId: string): Promise<void> {
  await requireSession();

  // Generate random shuffled arrays of 0-9
  const homeNums = Array.from({ length: 10 }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );
  const awayNums = Array.from({ length: 10 }, (_, i) => i).sort(
    () => Math.random() - 0.5
  );

  await db
    .update(superBowlSquaresConfig)
    .set({
      homeNumbers: JSON.stringify(homeNums),
      awayNumbers: JSON.stringify(awayNums),
    })
    .where(eq(superBowlSquaresConfig.gameId, gameId));

  revalidatePath(`/squares/${gameId}`);
  revalidatePath(`/admin/squares-games/${gameId}`);
}

export async function lockBoardAction(gameId: string): Promise<void> {
  await requireSession();

  await db
    .update(superBowlSquaresConfig)
    .set({ isLocked: true })
    .where(eq(superBowlSquaresConfig.gameId, gameId));

  revalidatePath(`/squares/${gameId}`);
  revalidatePath(`/admin/squares-games/${gameId}`);
}
