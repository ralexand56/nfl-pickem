"use server";

import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { requireGroupAdmin } from "@/lib/group";
import { revalidatePath } from "next/cache";

export async function createGameAction(
  slug: string,
  gameId: string,
  season: number,
  homeTeam: string,
  awayTeam: string,
  pricePerSquare: number
): Promise<void> {
  try {
    const { group } = await requireGroupAdmin(slug);

    // Validate inputs
    if (!gameId || !homeTeam || !awayTeam) {
      throw new Error("All fields are required");
    }

    if (pricePerSquare < 1) {
      throw new Error("Price per square must be at least $1");
    }

    // Create the game config
    await db.insert(superBowlSquaresConfig).values({
      groupId: group.id,
      gameId,
      season,
      homeTeam,
      awayTeam,
      pricePerSquare,
      isLocked: false,
      homeNumbers: null,
      awayNumbers: null,
    });

    revalidatePath(`/g/${slug}/admin/squares`);
    revalidatePath(`/g/${slug}/squares`);
  } catch (error) {
    console.error("Error in createGameAction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create game");
  }
}
