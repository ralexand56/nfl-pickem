import { NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyTiebreakers } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireSession();
  const { season, week, mnfTotalPointsGuess } = await req.json();

  try {
    await db
      .insert(weeklyTiebreakers)
      .values({ userId: session.user!.id!, season, week, mnfTotalPointsGuess })
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
