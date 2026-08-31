"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { claimSquareAction, unclaimSquareAction } from "./[gameId]/actions";
import type {
  SelectSuperBowlSquare,
  SelectSuperBowlSquaresConfig,
} from "@/db/schema";

type UserMap = Record<string, { name: string; image: string | null; email: string | null }>;

export default function SquaresGrid({
  squares,
  config,
  userMap,
  gameId,
  isBoardFull,
}: {
  squares: SelectSuperBowlSquare[];
  config: SelectSuperBowlSquaresConfig;
  userMap: UserMap;
  gameId: string;
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

    if (config.isLocked ?? false) {
      setError("Board is locked - no more changes can be made");
      return;
    }

    const square = squaresMap.get(`${row},${col}`);

    // If clicking your own square, unclaim it
    if (square?.userId === session.user.id) {
      setError(null);
      startTransition(async () => {
        try {
          await unclaimSquareAction(row, col, gameId);
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
        await claimSquareAction(row, col, gameId);
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to claim square");
      }
    });
  }

  const LEFT_COL = "w-8 sm:w-12";
  const CELL = "w-10 sm:w-16";
  const RIGHT_COL = "w-14 sm:w-20";
  const HEADER_H = "h-8 sm:h-12";
  const ROW_H = "h-10 sm:h-16";

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="mb-4 p-3 bg-danger-muted text-danger rounded-control">
          {error}
        </div>
      )}

      <div className="inline-block border-2 border-border">
        {/* Header row with away team numbers */}
        <div className="flex">
          <div className={`${LEFT_COL} ${HEADER_H} bg-surface-muted border-r border-b border-border`}></div>
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={`away-${i}`}
              className={`${CELL} ${HEADER_H} flex items-center justify-center font-bold text-xs sm:text-sm bg-surface-muted border-b border-border ${
                i < 9 ? "border-r" : ""
              }`}
            >
              {awayNumbers ? awayNumbers[i] : "?"}
            </div>
          ))}
          <div className={`${RIGHT_COL} ${HEADER_H} flex items-center justify-center text-xs font-semibold bg-surface-muted border-l-2 border-b border-border`}>
            {config.awayTeam}
          </div>
        </div>

        {/* Grid rows */}
        {Array.from({ length: 10 }, (_, row) => (
          <div key={`row-${row}`} className="flex">
            {/* Home team number */}
            <div
              className={`${LEFT_COL} ${ROW_H} flex items-center justify-center font-bold text-xs sm:text-sm bg-surface-muted border-r border-border ${
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
                    (config.isLocked ?? false)
                  }
                  className={`${CELL} ${ROW_H} text-[10px] sm:text-xs flex items-center justify-center transition-colors ${
                    isMine
                      ? "bg-success-muted hover:opacity-80 cursor-pointer"
                      : isOwned
                      ? "bg-surface-muted cursor-not-allowed"
                      : "bg-surface hover:bg-brand-50 cursor-pointer"
                  } ${pending ? "opacity-50" : ""} ${
                    col < 9 ? "border-r border-border" : ""
                  } ${row < 9 ? "border-b border-border" : ""}`}
                  title={
                    isMine
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
                    <span className="text-text-muted">-</span>
                  )}
                </button>
              );
            })}

            {/* Row label */}
            {row === 4 && (
              <div className={`${RIGHT_COL} ${ROW_H} flex items-center justify-center text-xs font-semibold bg-surface-muted border-l-2 border-border`}>
                {config.homeTeam}
              </div>
            )}
            {row !== 4 && <div className={`${RIGHT_COL} ${ROW_H} border-l-2 border-border`}></div>}
          </div>
        ))}
      </div>

      {isBoardFull && !(config.isLocked ?? false) ? (
        <div className="mt-4 p-3 bg-brand-50 border border-brand-200 rounded-control text-sm text-text">
          <strong>Board is Full!</strong> All 100 squares are claimed. Players can still make changes until the admin locks the board.
        </div>
      ) : !(config.isLocked ?? false) ? (
        <div className="mt-4 p-3 bg-warning-muted rounded-control text-sm text-text">
          <strong>Note:</strong> Numbers will be randomly assigned after all
          squares are filled.
        </div>
      ) : null}
    </div>
  );
}
