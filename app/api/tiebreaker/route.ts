import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { weeklyTiebreakers } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireSession();
  const userId = session.user!.id!;
  const { season, week, mnfTotalPointsGuess } = await req.json();

  try {
    const takenBySomeoneElse = await db
      .select({ id: weeklyTiebreakers.id })
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.season, season),
          eq(weeklyTiebreakers.week, week),
          eq(weeklyTiebreakers.mnfTotalPointsGuess, mnfTotalPointsGuess),
          ne(weeklyTiebreakers.userId, userId)
        )
      )
      .limit(1);

    if (takenBySomeoneElse.length > 0) {
      return NextResponse.json(
        {
          error:
            "That number has already been picked by another player. Please choose a different number.",
        },
        { status: 409 }
      );
    }

    await db
      .insert(weeklyTiebreakers)
      .values({ userId, season, week, mnfTotalPointsGuess })
      .onConflictDoUpdate({
        target: [
          weeklyTiebreakers.userId,
          weeklyTiebreakers.season,
          weeklyTiebreakers.week,
        ],
        set: { mnfTotalPointsGuess },
      });
  } catch (error) {
    console.error("Failed to save tiebreaker:", error);
    return NextResponse.json(
      { error: "Failed to save tiebreaker" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
