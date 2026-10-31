"use server";

import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { requireGroupAdmin } from "@/lib/group";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

// Every action is limited to the admin's own group, so a board id from
// another group matches nothing.
async function updateBoard(
  slug: string,
  gameId: string,
  changes: Partial<typeof superBowlSquaresConfig.$inferInsert>
) {
  const { group } = await requireGroupAdmin(slug);
  await db
    .update(superBowlSquaresConfig)
    .set(changes)
    .where(
      and(
        eq(superBowlSquaresConfig.groupId, group.id),
        eq(superBowlSquaresConfig.gameId, gameId)
      )
    );
  revalidatePath(`/g/${slug}/squares/${gameId}`);
  revalidatePath(`/g/${slug}/admin/squares/${gameId}`);
  revalidatePath(`/g/${slug}/admin/squares`);
}

// Fisher-Yates; sort(() => Math.random() - 0.5) isn't a uniform shuffle.
function shuffledDigits() {
  const arr = Array.from({ length: 10 }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function updateConfigAction(
  slug: string,
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  pricePerSquare: number
): Promise<void> {
  await updateBoard(slug, gameId, { homeTeam, awayTeam, pricePerSquare });
}

export async function generateNumbersAction(
  slug: string,
  gameId: string
): Promise<void> {
  await updateBoard(slug, gameId, {
    homeNumbers: JSON.stringify(shuffledDigits()),
    awayNumbers: JSON.stringify(shuffledDigits()),
  });
}

export async function lockBoardAction(slug: string, gameId: string): Promise<void> {
  await updateBoard(slug, gameId, { isLocked: true });
}

export async function unlockBoardAction(
  slug: string,
  gameId: string
): Promise<void> {
  await updateBoard(slug, gameId, { isLocked: false });
}
