import { db } from "@/db";
import { superBowlSquaresConfig, superBowlSquares } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";
import CreateGameForm from "./create-game-form";

export const dynamic = "force-dynamic";

async function getGames() {
  const games = await db.select().from(superBowlSquaresConfig).orderBy(sql`created_at DESC`);

  // Get square counts for each game
  const gamesWithCounts = await Promise.all(
    games.map(async (game) => {
      const squares = await db
        .select()
        .from(superBowlSquares)
        .where(eq(superBowlSquares.gameId, game.gameId));

      const claimedCount = squares.filter((s) => s.userId !== null).length;
      const totalRevenue = claimedCount * game.pricePerSquare;

      return {
        ...game,
        claimedCount,
        totalRevenue,
      };
    })
  );

  return gamesWithCounts;
}

export default async function SquaresGamesAdminPage() {
  const games = await getGames();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manage Squares Games</h1>

      {/* Create New Game Section */}
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Create New Game</h2>
        <CreateGameForm />
      </div>

      {/* Existing Games List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Existing Games ({games.length})</h2>

        {games.length === 0 ? (
          <p className="text-gray-500">No games created yet. Create one above!</p>
        ) : (
          <div className="grid gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {game.awayTeam} @ {game.homeTeam}
                      </h3>
                      {game.isLocked && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          Locked
                        </span>
                      )}
                      {game.claimedCount === 100 && !game.isLocked && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          Full
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Game ID:</strong> {game.gameId}
                      </p>
                      <p>
                        <strong>Season:</strong> {game.season}
                      </p>
                      <p>
                        <strong>Price:</strong> ${game.pricePerSquare} per square
                      </p>
                      <p>
                        <strong>Squares Claimed:</strong> {game.claimedCount}/100
                      </p>
                      <p>
                        <strong>Total Revenue:</strong> ${game.totalRevenue}
                      </p>
                      {game.homeNumbers && game.awayNumbers && (
                        <p className="text-green-600">
                          ✓ Numbers assigned
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/squares/${game.gameId}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm"
                    >
                      View Game
                    </Link>
                    <Link
                      href={`/admin/squares-games/${game.gameId}`}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-center text-sm"
                    >
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
