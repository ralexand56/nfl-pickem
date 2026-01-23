"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { claimSquareAction, unclaimSquareAction } from "./actions";
import type {
  SelectSuperBowlSquare,
  SelectSuperBowlSquaresConfig,
  SelectUser,
} from "@/db/schema";

type UserMap = Record<string, SelectUser>;

export default function SquaresGrid({
  squares,
  config,
  userMap,
  season,
  isBoardFull,
}: {
  squares: SelectSuperBowlSquare[];
  config: SelectSuperBowlSquaresConfig;
  userMap: UserMap;
  season: number;
  isBoardFull: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const homeNumbers = config.homeNumbers
    ? JSON.parse(config.homeNumbers)
    : null;
  const awayNumbers = config.awayNumbers
    ? JSON.parse(config.awayNumbers)
    : null;

  // Create a map of row,col to square
  const squaresMap = new Map<string, SelectSuperBowlSquare>();
  squares.forEach((sq) => {
    squaresMap.set(`${sq.row},${sq.col}`, sq);
  });

  async function handleSquareClick(row: number, col: number) {
    if (!session?.user?.id) {
      setError("Please sign in to claim a square");
      return;
    }

    if ((config.isLocked ?? false) || isBoardFull) {
      setError("Board is locked - no more changes can be made");
      return;
    }

    const square = squaresMap.get(`${row},${col}`);

    // If clicking your own square, unclaim it
    if (square?.userId === session.user.id) {
      setError(null);
      startTransition(async () => {
        try {
          await unclaimSquareAction(row, col, season);
          router.refresh();
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Failed to unclaim square");
        }
      });
      return;
    }

    // If square is claimed by someone else
    if (square?.userId) {
      setError("This square is already claimed");
      return;
    }

    // Claim the square
    setError(null);
    startTransition(async () => {
      try {
        await claimSquareAction(row, col, season);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to claim square");
      }
    });
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="inline-block border-2 border-gray-400">
        {/* Header row with away team numbers */}
        <div className="flex">
          <div className="w-12 h-12 bg-gray-100 border-r border-b border-gray-400"></div>
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`away-${i}`}
              className={`w-16 h-12 flex items-center justify-center font-bold text-sm bg-gray-100 border-b border-gray-400 ${
                i < 9 ? "border-r" : ""
              }`}
            >
              {awayNumbers ? awayNumbers[i] : "?"}
            </div>
          ))}
          <div className="w-20 h-12 flex items-center justify-center text-xs font-semibold bg-gray-100 border-l-2 border-b border-gray-400">
            {config.awayTeam}
          </div>
        </div>

        {/* Grid rows */}
        {Array.from({ length: 10 }, (_, row) => (
          <div key={`row-${row}`} className="flex">
            {/* Home team number */}
            <div
              className={`w-12 h-16 flex items-center justify-center font-bold text-sm bg-gray-100 border-r border-gray-400 ${
                row < 9 ? "border-b" : ""
              }`}
            >
              {homeNumbers ? homeNumbers[row] : "?"}
            </div>

            {/* Squares */}
            {Array.from({ length: 10 }, (_, col) => {
              const square = squaresMap.get(`${row},${col}`);
              const owner = square?.userId ? userMap[square.userId] : null;
              const isOwned = !!owner;
              const isMine = square?.userId === session?.user?.id;

              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onClick={() => handleSquareClick(row, col)}
                  disabled={
                    pending ||
                    (isOwned && !isMine) ||
                    (config.isLocked ?? false) ||
                    isBoardFull
                  }
                  className={`w-16 h-16 text-xs flex items-center justify-center transition-colors ${
                    isMine
                      ? isBoardFull
                        ? "bg-green-200 cursor-not-allowed"
                        : "bg-green-200 hover:bg-green-300 cursor-pointer"
                      : isOwned
                      ? "bg-gray-200 cursor-not-allowed"
                      : isBoardFull
                      ? "bg-white cursor-not-allowed"
                      : "bg-white hover:bg-blue-50 cursor-pointer"
                  } ${pending ? "opacity-50" : ""} ${
                    col < 9 ? "border-r border-gray-300" : ""
                  } ${row < 9 ? "border-b border-gray-300" : ""}`}
                  title={
                    isBoardFull
                      ? "Board is full - locked"
                      : isMine
                      ? "Click to unclaim"
                      : owner
                      ? `Owned by ${owner.name || owner.email}`
                      : "Click to claim"
                  }
                >
                  {owner ? (
                    <span className="truncate px-1">
                      {owner.name?.split(" ")[0] || owner.email?.split("@")[0]}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </button>
              );
            })}

            {/* Row label */}
            {row === 4 && (
              <div className="w-20 h-16 flex items-center justify-center text-xs font-semibold bg-gray-100 border-l-2 border-gray-400">
                {config.homeTeam}
              </div>
            )}
            {row !== 4 && <div className="w-20 h-16 border-l-2 border-gray-400"></div>}
          </div>
        ))}
      </div>

      {isBoardFull && !(config.isLocked ?? false) ? (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm">
          <strong>Board is Full!</strong> All 100 squares are claimed. No more
          changes can be made. Waiting for admin to assign numbers.
        </div>
      ) : !(config.isLocked ?? false) ? (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
          <strong>Note:</strong> Numbers will be randomly assigned after all
          squares are filled.
        </div>
      ) : null}
    </div>
  );
}
