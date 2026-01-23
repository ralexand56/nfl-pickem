"use server";

import { db } from "@/db";
import { superBowlSquares, superBowlSquaresConfig } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function claimSquareAction(
  row: number,
  col: number,
  season: number
): Promise<void> {
  const session = await requireSession();

  // Check if config is locked
  const config = await db
    .select()
    .from(superBowlSquaresConfig)
    .where(eq(superBowlSquaresConfig.season, season))
    .limit(1)
    .then((rows) => rows[0]);

  if (config?.isLocked) {
    throw new Error("Squares are locked");
  }

  // Check if all 100 squares are filled
  const allSquares = await db
    .select()
    .from(superBowlSquares)
    .where(eq(superBowlSquares.season, season));

  const filledCount = allSquares.filter((s) => s.userId !== null).length;
  if (filledCount >= 100) {
    throw new Error("All squares are filled. No more changes can be made.");
  }

  // Check if square already exists
  const existing = await db
    .select()
    .from(superBowlSquares)
    .where(
      and(
        eq(superBowlSquares.row, row),
        eq(superBowlSquares.col, col),
        eq(superBowlSquares.season, season)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existing?.userId) {
    throw new Error("Square already claimed");
  }

  // Claim or update the square
  if (existing) {
    await db
      .update(superBowlSquares)
      .set({
        userId: session.user!.id!,
        claimedAt: new Date(),
        isPaid: false,
      })
      .where(eq(superBowlSquares.id, existing.id));
  } else {
    await db.insert(superBowlSquares).values({
      row,
      col,
      userId: session.user!.id!,
      season,
      claimedAt: new Date(),
      isPaid: false,
    });
  }

  revalidatePath("/squares");
}

export async function unclaimSquareAction(
  row: number,
  col: number,
  season: number
): Promise<void> {
  const session = await requireSession();

  // Check if config is locked
  const config = await db
    .select()
    .from(superBowlSquaresConfig)
    .where(eq(superBowlSquaresConfig.season, season))
    .limit(1)
    .then((rows) => rows[0]);

  if (config?.isLocked) {
    throw new Error("Squares are locked");
  }

  // Check if all 100 squares are filled
  const allSquares = await db
    .select()
    .from(superBowlSquares)
    .where(eq(superBowlSquares.season, season));

  const filledCount = allSquares.filter((s) => s.userId !== null).length;
  if (filledCount >= 100) {
    throw new Error("All squares are filled. No more changes can be made.");
  }

  // Check if square exists and is owned by current user
  const existing = await db
    .select()
    .from(superBowlSquares)
    .where(
      and(
        eq(superBowlSquares.row, row),
        eq(superBowlSquares.col, col),
        eq(superBowlSquares.season, season)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    throw new Error("Square not found");
  }

  if (existing.userId !== session.user!.id!) {
    throw new Error("You don't own this square");
  }

  // Delete or clear the square
  await db
    .delete(superBowlSquares)
    .where(eq(superBowlSquares.id, existing.id));

  revalidatePath("/squares");
}
