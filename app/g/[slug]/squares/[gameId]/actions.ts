"use server";

import { db } from "@/db";
import { superBowlSquares, superBowlSquaresConfig } from "@/db/schema";
import { isSeasonActive, requireGroupMember } from "@/lib/group";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function claimSquareAction(
  slug: string,
  row: number,
  col: number,
  gameId: string
): Promise<void> {
  try {
    const { group, viewer, settings } = await requireGroupMember(slug);
    if (!settings.squaresEnabled) throw new Error("Squares are turned off for this group");

    // Check if config is locked
    const config = await db
      .select()
      .from(superBowlSquaresConfig)
      .where(
        and(
          eq(superBowlSquaresConfig.groupId, group.id),
          eq(superBowlSquaresConfig.gameId, gameId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!config) {
      throw new Error("Game configuration not found");
    }

    if (config.isLocked) {
      throw new Error("Squares are locked");
    }

    if (!(await isSeasonActive(group.id, config.season))) {
      throw new Error(
        `Your group isn't active for the ${config.season} season yet. Ask your admin to renew.`
      );
    }

    // Check if square already exists
    const existing = await db
      .select()
      .from(superBowlSquares)
      .where(
        and(
          eq(superBowlSquares.groupId, group.id),
          eq(superBowlSquares.row, row),
          eq(superBowlSquares.col, col),
          eq(superBowlSquares.gameId, gameId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (existing?.userId) {
      throw new Error("Square already claimed");
    }

    // Get season from config for backward compatibility
    const season = config.season;

    // Claim or update the square
    if (existing) {
      await db
        .update(superBowlSquares)
        .set({
          userId: viewer.id,
          claimedAt: new Date(),
          isPaid: false,
        })
        .where(eq(superBowlSquares.id, existing.id));
    } else {
      await db.insert(superBowlSquares).values({
        groupId: group.id,
        gameId,
        row,
        col,
        userId: viewer.id,
        season,
        claimedAt: new Date(),
        isPaid: false,
      });
    }

    revalidatePath(`/g/${slug}/squares/${gameId}`);
  } catch (error) {
    console.error("Error in claimSquareAction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to claim square. Please try again.");
  }
}

export async function unclaimSquareAction(
  slug: string,
  row: number,
  col: number,
  gameId: string
): Promise<void> {
  try {
    const { group, viewer, settings } = await requireGroupMember(slug);
    if (!settings.squaresEnabled) throw new Error("Squares are turned off for this group");

    // Check if config is locked
    const config = await db
      .select()
      .from(superBowlSquaresConfig)
      .where(
        and(
          eq(superBowlSquaresConfig.groupId, group.id),
          eq(superBowlSquaresConfig.gameId, gameId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!config) {
      throw new Error("Game configuration not found");
    }

    if (config.isLocked) {
      throw new Error("Squares are locked");
    }

    // Check if square exists and is owned by current user
    const existing = await db
      .select()
      .from(superBowlSquares)
      .where(
        and(
          eq(superBowlSquares.groupId, group.id),
          eq(superBowlSquares.row, row),
          eq(superBowlSquares.col, col),
          eq(superBowlSquares.gameId, gameId)
        )
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!existing) {
      throw new Error("Square not found");
    }

    if (existing.userId !== viewer.id) {
      throw new Error("You don't own this square");
    }

    // Delete or clear the square
    await db
      .delete(superBowlSquares)
      .where(eq(superBowlSquares.id, existing.id));

    revalidatePath(`/g/${slug}/squares/${gameId}`);
  } catch (error) {
    console.error("Error in unclaimSquareAction:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to unclaim square. Please try again.");
  }
}
