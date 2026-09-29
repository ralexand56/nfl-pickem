import { db } from "@/db";
import { games, picks, weeklyTiebreakers, users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import PicksClient from "./picks-client";
import PaymentTracker from "@/components/PaymentTracker";
import { getPaymentViewer, getWeekPayments } from "@/lib/payments";

export default async function WeekPage({
  params,
}: {
  params: { season: string; week: string };
}) {
  const { season, week } = await params;
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
        inArray(
          picks.gameId,
          gs.map((g) => g.id)
        )
      );

    const tbs = await db
      .select()
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.season, seasonNumber),
          eq(weeklyTiebreakers.week, weekNumber)
        )
      );

    const [paymentPlayers, viewer] = await Promise.all([
      getWeekPayments(seasonNumber, weekNumber),
      getPaymentViewer(),
    ]);
    const participantIds = Array.from(
      new Set(allPicks.map((p) => p.picks.userId))
    );

    return (
      <PicksClient
        paymentTracker={
          <PaymentTracker
            players={paymentPlayers}
            participantIds={participantIds}
            season={seasonNumber}
            week={weekNumber}
            viewer={viewer}
          />
        }
        games={gs}
        allPicks={allPicks}
        tiebreakers={tbs}
        season={seasonNumber}
        week={weekNumber}
      />
    );
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}
