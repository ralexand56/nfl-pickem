import { NextResponse } from "next/server";
import { db } from "@/db";
import { picks, games } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  isSeasonActive,
  requireGroupMember,
  type GroupContext,
} from "@/lib/group";
import { groupErrorResponse } from "@/lib/api";
import { pickDeadlineMs } from "@/lib/group-settings";

export async function POST(req: Request) {
  const { group: slug, gameId, pick } = await req.json();

  let ctx: GroupContext;
  try {
    ctx = await requireGroupMember(slug);
  } catch (error) {
    return groupErrorResponse(error);
  }

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game)
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });

  if (!(await isSeasonActive(ctx.group.id, game.season))) {
    return NextResponse.json(
      { error: `Your group isn't active for the ${game.season} season yet. Ask your admin to renew.` },
      { status: 402 }
    );
  }

  // Enforce the group's cutoff: the first kickoff of the week, or (if the
  // group allows it) each game's own kickoff.
  const weekGames = await db
    .select({ date: games.date })
    .from(games)
    .where(and(eq(games.season, game.season), eq(games.week, game.week)));
  const rule = ctx.settings.pickDeadline;
  if (Date.now() > pickDeadlineMs(rule, game, weekGames)) {
    return NextResponse.json(
      {
        error:
          rule === "game"
            ? "This game has already started"
            : "Picks are closed for this week",
      },
      { status: 403 }
    );
  }

  try {
    await db
      .insert(picks)
      .values({ groupId: ctx.group.id, userId: ctx.viewer.id, gameId, pick })
      .onConflictDoUpdate({
        target: [picks.groupId, picks.userId, picks.gameId],
        set: { pick },
      });
  } catch (error) {
    console.error("Failed to save pick:", error);
    return NextResponse.json({ error: "Failed to save pick" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
