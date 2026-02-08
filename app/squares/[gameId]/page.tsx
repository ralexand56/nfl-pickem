import { db } from "@/db";
import { superBowlSquares, superBowlSquaresConfig } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import SquaresGrid from "../squares-grid";
import { getUserMap } from "@/lib/sportsdb";

export const dynamic = "force-dynamic";

export default async function SquaresPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  // Get config for this game
  const config = await db
    .select()
    .from(superBowlSquaresConfig)
    .where(eq(superBowlSquaresConfig.gameId, gameId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!config) {
    notFound();
  }

  // Get all squares for this game
  const squares = await db
    .select()
    .from(superBowlSquares)
    .where(eq(superBowlSquares.gameId, gameId));

  // Get user map for display names
  const userMap = await getUserMap();

  // Check if board is full
  const filledCount = squares.filter((s) => s.userId).length;
  const isBoardFull = filledCount >= 100;

  return (
    <main className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Super Bowl Squares</h1>
      <p className="text-gray-600 mb-6">
        ${config.pricePerSquare} per square · {config.awayTeam} vs{" "}
        {config.homeTeam}
        {isBoardFull && (
          <span className="ml-2 text-orange-600 font-semibold">
            • BOARD FULL
          </span>
        )}
      </p>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">How It Works:</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Click any available square to claim it for ${config.pricePerSquare}</li>
          <li>• Click your own square again to unclaim it (green squares)</li>
          <li>
            • After all squares are filled, random numbers (0-9) will be assigned
            to each row and column
          </li>
          <li>
            • Winners are determined by the last digit of each team&apos;s score at
            the end of each quarter
          </li>
          <li>• Prize pool will be split: Q1 (20% - ${config.pricePerSquare * 20}), Q2 (20% - ${config.pricePerSquare * 20}), Q3 (20% - ${config.pricePerSquare * 20}), Final (40% - ${config.pricePerSquare * 40})</li>
        </ul>
      </div>

      <SquaresGrid
        squares={squares}
        config={config}
        userMap={userMap}
        gameId={gameId}
        isBoardFull={isBoardFull}
      />

      <div className="mt-6 text-sm text-gray-600">
        <p>Total pot: ${config.pricePerSquare * 100}</p>
        <p>
          Claimed squares: {squares.filter((s) => s.userId).length} / 100
        </p>
      </div>

      {/* Player List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Players</h2>
        <div className="grid gap-3">
          {Object.entries(
            squares
              .filter((s) => s.userId)
              .reduce((acc, square) => {
                const userId = square.userId!;
                if (!acc[userId]) {
                  acc[userId] = 0;
                }
                acc[userId]++;
                return acc;
              }, {} as Record<string, number>)
          )
            .sort(([, a], [, b]) => b - a) // Sort by number of squares, descending
            .map(([userId, count]) => {
              const user = userMap[userId];
              const totalOwed = count * config.pricePerSquare;
              const isPaid =
                squares.find((s) => s.userId === userId)?.isPaid ?? false;

              return (
                <div
                  key={userId}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-center gap-3">
                    {user?.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.image}
                        alt={user.name || user.email || "User"}
                        className="w-10 h-10 rounded-lg"
                      />
                    )}
                    <div>
                      <div className="font-semibold">
                        {user?.name || user?.email || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {count} {count === 1 ? "square" : "squares"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">${totalOwed}</div>
                    {isPaid && (
                      <div className="text-xs text-green-600">Paid ✓</div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {squares.filter((s) => s.userId).length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No squares claimed yet
          </p>
        )}
      </div>
    </main>
  );
}
