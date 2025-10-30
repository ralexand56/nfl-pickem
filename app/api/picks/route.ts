import { NextResponse } from "next/server";
import { db } from "@/db";
import { picks, games } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const season = Number(searchParams.get("season"));
  const week = Number(searchParams.get("week"));

  const weekGames = await db
    .select({ id: games.id })
    .from(games)
    .where(and(eq(games.season, season), eq(games.week, week)));

  const rows = await db
    .select()
    .from(picks)
    .where(
      inArray(
        picks.gameId,
        weekGames.map((g) => g.id)
      )
    );

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await requireSession();
  const { gameId, pick } = await req.json();

  const [game] = await db.select().from(games).where(eq(games.id, gameId));
  if (!game)
    return NextResponse.json({ error: "Unknown game" }, { status: 400 });

  // Enforce cutoff: no picks after the first game of the week has started
  const [firstGame] = await db
    .select()
    .from(games)
    .where(and(eq(games.season, game.season), eq(games.week, game.week)))
    .orderBy(games.date)
    .limit(1);

  if (firstGame && new Date().getTime() > new Date(firstGame.date).getTime()) {
    return NextResponse.json(
      { error: "Picks are closed for this week" },
      { status: 403 }
    );
  }

  await db
    .insert(picks)
    .values({ userId: session.user!.id!, gameId, pick })
    .onConflictDoUpdate({
      target: [picks.userId, picks.gameId],
      set: { pick },
    });

  return NextResponse.json({ ok: true });
}
