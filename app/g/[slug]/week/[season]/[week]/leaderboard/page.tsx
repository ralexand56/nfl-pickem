import { db } from "@/db";
import { games, picks, weeklyTiebreakers } from "@/db/schema";
import { and, eq, inArray, desc } from "drizzle-orm";
import { scoreUser } from "@/lib/scoring";
import { getUserMap } from "@/lib/users";
import { syncScoresMinimal } from "@/lib/server/syncScoresMinimal";
import Image from "next/image";
import WeekSelector from "./week-selector";
import Card from "@/components/ui/Card";
import Table, { TableContainer } from "@/components/ui/Table";
import PaymentTracker, { PaidToggle } from "@/components/PaymentTracker";
import { getWeekPayments } from "@/lib/payments";
import { getGroupContext } from "@/lib/group";
import { notFound } from "next/navigation";
import { getCurrentNfl } from "@/lib/server";
import { getWeekLabel, getWeekStatus } from "@/lib/weeks";
import WeekStatusBadge from "@/components/WeekStatusBadge";

export default async function Leaderboard({
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

  // Sync scores before loading page data
  await syncScoresMinimal({
    seasonYear: seasonNumber,
    week: weekNumber,
    force: false, // Use cache unless you want fresh data every time
  });

  // Get all available weeks for the dropdown
  const availableWeeks = await db
    .selectDistinct({ week: games.week, season: games.season })
    .from(games)
    .orderBy(desc(games.season), desc(games.week));

  const gs = await db
    .select()
    .from(games)
    .where(and(eq(games.season, seasonNumber), eq(games.week, weekNumber)));

  const ps = await db
    .select()
    .from(picks)
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

  const [userMap, paymentPlayers, current] = await Promise.all([
    getUserMap(groupId),
    getWeekPayments(groupId, seasonNumber, weekNumber),
    getCurrentNfl(),
  ]);
  const viewer = ctx.viewer;
  const paymentByUser = new Map(paymentPlayers.map((p) => [p.id, p]));
  const { buyInEnabled, tiebreakerEnabled, includePlayoffs } = ctx.settings;
  // Picks from people who have since left the group stay in the DB but
  // don't show.
  const userIds = Array.from(new Set(ps.map((p) => p.userId))).filter(
    (uid) => userMap[uid]
  );
  const rows = userIds
    .map((uid) => ({
      uid,
      ...scoreUser(
        uid,
        gs,
        ps,
        tiebreakerEnabled ? tbs.find((t) => t.userId === uid) || null : null
      ),
    }))
    .sort(
      (a, b) =>
        b.correct - a.correct ||
        (a.tieDistance ?? 9999) - (b.tieDistance ?? 9999)
    );

  const winner = rows[0];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text flex items-center gap-3">
          <span>{getWeekLabel(weekNumber)} Leaderboard</span>
          <WeekStatusBadge
            status={getWeekStatus(seasonNumber, weekNumber, current)}
          />
        </h1>
        <WeekSelector
          availableWeeks={
            includePlayoffs
              ? availableWeeks
              : availableWeeks.filter((w) => w.week <= 18)
          }
          currentSeason={seasonNumber}
          currentWeek={weekNumber}
          liveNfl={current}
        />
      </div>
      {winner && (
        <Card className="mb-6 bg-success-muted border-transparent">
          <div className="font-semibold text-text">Winner:</div>
          <div className="text-text">
            {userMap[winner.uid].name.slice(0, 12)} · {winner.correct} correct{" "}
            {winner.tieDistance != null ? `(TB +${winner.tieDistance})` : ""}
          </div>
        </Card>
      )}
      <TableContainer>
        <Table>
          <thead>
            <tr className="text-left text-sm text-text-muted">
              <th> </th>
              <th>User</th>
              <th>Correct</th>
              {tiebreakerEnabled && (
                <>
                  <th>Tiebreak</th>
                  <th>Tiebreaker Diff</th>
                </>
              )}
              {buyInEnabled && <th>Paid</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.uid} className="bg-surface">
                <td className="p-2">
                  <Image
                    src={userMap[r.uid].image || ""}
                    alt={userMap[r.uid].name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </td>
                <td className="p-2 text-text">{userMap[r.uid].name.slice(0, 12)}</td>
                <td className="p-2 text-text">{r.correct}</td>
                {tiebreakerEnabled && (
                  <>
                    <td className="p-2 text-text">{r.tb}</td>
                    <td className="p-2 text-text">{r.tieDistance ?? "—"}</td>
                  </>
                )}
                {buyInEnabled && (
                  <td className="p-2">
                    {paymentByUser.has(r.uid) && (
                      <PaidToggle
                        player={paymentByUser.get(r.uid)!}
                        season={seasonNumber}
                        week={weekNumber}
                        viewer={viewer}
                      />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
      {buyInEnabled && (
        <div className="mt-6">
          <PaymentTracker
            players={paymentPlayers}
            participantIds={userIds}
            season={seasonNumber}
            week={weekNumber}
            viewer={viewer}
          />
        </div>
      )}
    </main>
  );
}
