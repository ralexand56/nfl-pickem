"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateConfigAction,
  generateNumbersAction,
  lockBoardAction,
  unlockBoardAction,
} from "./actions";
import type { SelectSuperBowlSquaresConfig } from "@/db/schema";

export default function SquaresAdmin({
  config,
  season,
}: {
  config: SelectSuperBowlSquaresConfig;
  season: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [homeTeam, setHomeTeam] = useState(config.homeTeam);
  const [awayTeam, setAwayTeam] = useState(config.awayTeam);
  const [pricePerSquare, setPricePerSquare] = useState(config.pricePerSquare);

  const homeNumbers = config.homeNumbers
    ? JSON.parse(config.homeNumbers)
    : null;
  const awayNumbers = config.awayNumbers
    ? JSON.parse(config.awayNumbers)
    : null;

  function handleUpdateConfig() {
    startTransition(async () => {
      await updateConfigAction(season, homeTeam, awayTeam, pricePerSquare);
      router.refresh();
    });
  }

  function handleGenerateNumbers() {
    if (
      !confirm(
        "This will randomly assign numbers 0-9 to rows and columns. This cannot be undone. Continue?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await generateNumbersAction(season);
      router.refresh();
    });
  }

  function handleLockBoard() {
    if (
      !confirm(
        "This will lock the board so no more squares can be claimed. Continue?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await lockBoardAction(season);
      router.refresh();
    });
  }

  function handleUnlockBoard() {
    if (
      !confirm(
        "This will unlock the board so players can claim/unclaim squares again. Continue?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      await unlockBoardAction(season);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Config Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Game Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Home Team
            </label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={config.isLocked ?? false}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Away Team
            </label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={config.isLocked ?? false}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Price Per Square ($)
            </label>
            <input
              type="number"
              value={pricePerSquare}
              onChange={(e) => setPricePerSquare(Number(e.target.value))}
              className="w-full border rounded-lg px-3 py-2"
              disabled={config.isLocked ?? false}
            />
          </div>
          <button
            onClick={handleUpdateConfig}
            disabled={pending || (config.isLocked ?? false)}
            className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
          >
            {pending ? "Updating..." : "Update Configuration"}
          </button>
        </div>
      </div>

      {/* Numbers Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Numbers Assignment</h2>
        {homeNumbers && awayNumbers ? (
          <div className="space-y-2">
            <div>
              <strong>Home ({homeTeam}):</strong> {homeNumbers.join(", ")}
            </div>
            <div>
              <strong>Away ({awayTeam}):</strong> {awayNumbers.join(", ")}
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Numbers have been assigned and locked.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Generate random numbers (0-9) for rows and columns. This should be
              done after all squares are claimed or when you&apos;re ready to finalize
              the board.
            </p>
            <button
              onClick={handleGenerateNumbers}
              disabled={pending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              {pending ? "Generating..." : "Generate Random Numbers"}
            </button>
          </div>
        )}
      </div>

      {/* Lock Section */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Board Status</h2>
        {config.isLocked ? (
          <div className="space-y-4">
            <p className="text-green-600 font-semibold">
              ✓ Board is locked - No more squares can be claimed
            </p>
            <button
              onClick={handleUnlockBoard}
              disabled={pending}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50 hover:bg-orange-700"
            >
              {pending ? "Unlocking..." : "Unlock Board"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Lock the board to prevent any more squares from being claimed.
              Do this after numbers are assigned.
            </p>
            <button
              onClick={handleLockBoard}
              disabled={pending}
              className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50"
            >
              {pending ? "Locking..." : "Lock Board"}
            </button>
          </div>
        )}
      </div>

      {/* Link to public page */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <Link
          href="/squares"
          className="text-blue-600 hover:underline font-semibold"
        >
          → View Public Squares Page
        </Link>
      </div>
    </div>
  );
}
