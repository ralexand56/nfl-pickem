import { db } from "@/db";
import { games, picks, weeklyTiebreakers, users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import PicksClient from "./picks-client";
import PaymentTracker from "@/components/PaymentTracker";
import { getWeekPayments } from "@/lib/payments";
import { getGroupContext } from "@/lib/group";
import { notFound } from "next/navigation";
import { getCurrentNfl } from "@/lib/server";
import { getWeekStatus } from "@/lib/weeks";

export default async function WeekPage({
  params,
}: {
  params: Promise<{ slug: string; season: string; week: string }>;
}) {
  const { slug, season, week } = await params;
  const ctx = await getGroupContext(slug);
  if (!ctx) notFound();
  const groupId = ctx.group.id;
  const seasonNumber = Number(season);
  const weekNumber = Number(week);
  try {
    const gs = await db
      .select()
      .from(games)
      .where(and(eq(games.season, seasonNumber), eq(games.week, weekNumber)));

    const allPicks = await db
      .select()
      .from(picks)
      .innerJoin(users, eq(picks.userId, users.id))
      .where(
        and(
          eq(picks.groupId, groupId),
          inArray(
            picks.gameId,
            gs.map((g) => g.id)
          )
        )
      );

    const tbs = await db
      .select()
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.groupId, groupId),
          eq(weeklyTiebreakers.season, seasonNumber),
          eq(weeklyTiebreakers.week, weekNumber)
        )
      );

    const [paymentPlayers, current] = await Promise.all([
      getWeekPayments(groupId, seasonNumber, weekNumber),
      getCurrentNfl(),
    ]);
    const viewer = ctx.viewer;
    const participantIds = Array.from(
      new Set(allPicks.map((p) => p.picks.userId))
    );

    return (
      <PicksClient
        paymentTracker={
          ctx.settings.buyInEnabled && (
            <PaymentTracker
              players={paymentPlayers}
              participantIds={participantIds}
              season={seasonNumber}
              week={weekNumber}
              viewer={viewer}
            />
          )
        }
        games={gs}
        allPicks={allPicks}
        tiebreakers={tbs}
        season={seasonNumber}
        week={weekNumber}
        weekStatus={getWeekStatus(seasonNumber, weekNumber, current)}
      />
    );
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}
