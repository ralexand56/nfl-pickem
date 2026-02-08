"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createGameAction } from "./actions";

export default function CreateGameForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [gameId, setGameId] = useState("");
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [season, setSeason] = useState(2026);
  const [pricePerSquare, setPricePerSquare] = useState(5);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Generate gameId from team names if not provided
    const finalGameId =
      gameId.trim() ||
      `${awayTeam.toLowerCase().replace(/\s+/g, "-")}-at-${homeTeam
        .toLowerCase()
        .replace(/\s+/g, "-")}`;

    startTransition(async () => {
      try {
        await createGameAction(
          finalGameId,
          season,
          homeTeam,
          awayTeam,
          pricePerSquare
        );
        // Reset form
        setGameId("");
        setHomeTeam("");
        setAwayTeam("");
        router.refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to create game");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Away Team *
          </label>
          <input
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
            placeholder="e.g., Kansas City Chiefs"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Home Team *
          </label>
          <input
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            required
            placeholder="e.g., Philadelphia Eagles"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Season</label>
          <input
            type="number"
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Price per Square ($)
          </label>
          <input
            type="number"
            value={pricePerSquare}
            onChange={(e) => setPricePerSquare(Number(e.target.value))}
            className="w-full border rounded-lg px-3 py-2"
            required
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Game ID (optional)
          </label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Auto-generated from teams"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending || !homeTeam || !awayTeam}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create Game"}
      </button>
    </form>
  );
}
