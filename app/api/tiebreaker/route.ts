import { NextResponse } from "next/server";
import { db } from "@/db";
import { weeklyTiebreakers } from "@/db/schema";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await requireSession();
  const { season, week, mnfTotalPointsGuess } = await req.json();

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

  return NextResponse.json({ ok: true });
}
