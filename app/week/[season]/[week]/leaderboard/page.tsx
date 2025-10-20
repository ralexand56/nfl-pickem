import { db } from "@/db";
import { games, picks, weeklyTiebreakers } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { scoreUser } from "@/lib/scoring";
import { getUserMap } from "@/lib/sportsdb";
import { syncScoresMinimal } from "@/lib/server/syncScoresMinimal";
import Image from "next/image";

export default async function Leaderboard({
  params,
}: {
  params: { season: string; week: string };
}) {
  const { season, week } = await params;
  const seasonNumber = Number(season);
  const weekNumber = Number(week);

  // Sync scores before loading page data
  await syncScoresMinimal({
    seasonYear: seasonNumber,
    week: weekNumber,
    force: false, // Use cache unless you want fresh data every time
  });

  const gs = await db
    .select()
    .from(games)
    .where(and(eq(games.season, seasonNumber), eq(games.week, weekNumber)));

  const ps = await db
    .select()
    .from(picks)
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

  const userMap = await getUserMap();
  const userIds = Array.from(new Set(ps.map((p) => p.userId)));
  const rows = userIds
    .map((uid) => ({
      uid,
      ...scoreUser(uid, gs, ps, tbs.find((t) => t.userId === uid) || null),
    }))
    .sort(
      (a, b) =>
        b.correct - a.correct ||
        (a.tieDistance ?? 9999) - (b.tieDistance ?? 9999)
    );

  const winner = rows[0];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Week {week} Leaderboard</h1>
      {winner && (
        <div className="mb-6 p-4 rounded-xl border bg-green-50">
          <div className="font-semibold">Winner:</div>
          <div>
            {userMap[winner.uid].name.slice(0, 6)} · {winner.correct} correct{" "}
            {winner.tieDistance != null ? `(TB +${winner.tieDistance})` : ""}
          </div>
        </div>
      )}
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-sm text-gray-500">
            <th> </th>
            <th>User</th>
            <th>Correct</th>
            <th>Tiebreak</th>
            <th>Tiebreaker Diff</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.uid} className="bg-white">
              <td className="p-2">
                <Image
                  src={userMap[r.uid].image || ""}
                  alt={userMap[r.uid].name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </td>
              <td className="p-2">{userMap[r.uid].name.slice(0, 6)}</td>
              <td className="p-2">{r.correct}</td>
              <td className="p-2">{r.tb}</td>
              <td className="p-2">{r.tieDistance ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
