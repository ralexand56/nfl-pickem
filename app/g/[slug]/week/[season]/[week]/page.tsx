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
import { getUserMap } from "@/lib/users";
import { pickDeadlineMs, tiebreakerDeadlineMs } from "@/lib/group-settings";

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

    // Names only from users: this goes to the browser, so no emails.
    const allPicks = await db
      .select({ picks, users: { name: users.name } })
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

    const [paymentPlayers, current, userMap] = await Promise.all([
      getWeekPayments(groupId, seasonNumber, weekNumber),
      getCurrentNfl(),
      getUserMap(groupId),
    ]);
    const viewer = ctx.viewer;
    // Progress for "Who's in" is counts only, so it stays safe to send even
    // when the picks themselves are hidden.
    const members = Object.entries(userMap)
      .map(([id, u]) => ({
        id,
        name: u.name || "Member",
        pickedGameIds: allPicks
          .filter((p) => p.picks.userId === id)
          .map((p) => p.picks.gameId),
        hasTiebreaker: tbs.some((t) => t.userId === id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const participantIds = Array.from(
      new Set(allPicks.map((p) => p.picks.userId))
    );

    // With "hide picks until lock" on, other members' picks and guesses never
    // reach the browser before they lock.
    const { hidePicksUntilLock, pickDeadline, tiebreakerDeadline } = ctx.settings;
    const now = Date.now();
    const gameById = new Map(gs.map((g) => [g.id, g]));
    const visiblePicks = allPicks.filter((p) => {
      if (!hidePicksUntilLock || p.picks.userId === viewer.id) return true;
      const game = gameById.get(p.picks.gameId);
      return !!game && (game.status === "final" || now >= pickDeadlineMs(pickDeadline, game, gs));
    });
    const tiebreakersRevealed =
      !hidePicksUntilLock ||
      (gs.length > 0 && now >= tiebreakerDeadlineMs(tiebreakerDeadline, gs));
    const visibleTiebreakers = tbs.filter(
      (t) => tiebreakersRevealed || t.userId === viewer.id
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
        allPicks={visiblePicks}
        tiebreakers={visibleTiebreakers}
        members={members}
        season={seasonNumber}
        week={weekNumber}
        weekStatus={getWeekStatus(seasonNumber, weekNumber, current)}
      />
    );
  } catch (error) {
    console.error("Error fetching games:", error);
  }
}
