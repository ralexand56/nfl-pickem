import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { weeklyTiebreakers } from "@/db/schema";
import {
  GroupAccessError,
  isSeasonActive,
  requireGroupMember,
} from "@/lib/group";
import { groupErrorResponse } from "@/lib/api";

export async function POST(req: Request) {
  const { group: slug, season, week, mnfTotalPointsGuess } = await req.json();

  let userId: string;
  let groupId: string;
  try {
    const ctx = await requireGroupMember(slug);
    if (!ctx.settings.tiebreakerEnabled) {
      return NextResponse.json(
        { error: "This group doesn't use a tiebreaker." },
        { status: 403 }
      );
    }
    userId = ctx.viewer.id;
    groupId = ctx.group.id;
  } catch (error) {
    if (error instanceof GroupAccessError && error.status === 401) {
      return NextResponse.json(
        { error: "You've been signed out. Please sign in again to save your tiebreaker." },
        { status: 401 }
      );
    }
    return groupErrorResponse(error);
  }

  if (!Number.isInteger(season) || !(await isSeasonActive(groupId, season))) {
    return NextResponse.json(
      { error: `Your group isn't active for the ${season} season yet. Ask your admin to renew.` },
      { status: 402 }
    );
  }

  try {
    const takenBySomeoneElse = await db
      .select({ id: weeklyTiebreakers.id })
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.groupId, groupId),
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
      .values({ groupId, userId, season, week, mnfTotalPointsGuess })
      .onConflictDoUpdate({
        target: [
          weeklyTiebreakers.groupId,
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
