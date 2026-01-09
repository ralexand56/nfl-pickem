"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { updateGameAction } from "./actions";
import type { SelectGame } from "@/db/schema";

export default function GamesEditor({
  seasons,
  selectedSeason,
  selectedWeek,
  weeksForSeason,
  games,
}: {
  seasons: number[];
  selectedSeason: number | null;
  selectedWeek: number | null;
  weeksForSeason: number[];
  games: SelectGame[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  function handleSeasonChange(season: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (season) {
      params.set("season", season);
      params.delete("week"); // Reset week when season changes
    } else {
      params.delete("season");
      params.delete("week");
    }
    router.push(`/admin/games?${params.toString()}`);
  }

  function handleWeekChange(week: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (week && selectedSeason) {
      params.set("season", String(selectedSeason));
      params.set("week", week);
    } else {
      params.delete("week");
    }
    router.push(`/admin/games?${params.toString()}`);
  }

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await updateGameAction(formData);
      setEditingGameId(null);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600 mb-1">Season</span>
          <select
            value={selectedSeason ?? ""}
            onChange={(e) => handleSeasonChange(e.target.value)}
            className="border rounded-lg px-3 py-2 min-w-[120px]"
          >
            <option value="">Select season</option>
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {selectedSeason && (
          <label className="flex flex-col">
            <span className="text-sm text-gray-600 mb-1">Week</span>
            <select
              value={selectedWeek ?? ""}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="border rounded-lg px-3 py-2 min-w-[100px]"
              disabled={!selectedSeason}
            >
              <option value="">Select week</option>
              {weeksForSeason.map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {games.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {games.length} game{games.length !== 1 ? "s" : ""} for Season{" "}
            {selectedSeason}, Week {selectedWeek}
          </h2>

          <div className="grid gap-4">
            {games.map((game) => {
              const isEditing = editingGameId === game.id;
              const gameDate = new Date(game.date);
              const localDateString = new Date(
                gameDate.getTime() - gameDate.getTimezoneOffset() * 60000
              )
                .toISOString()
                .slice(0, 16);

              if (isEditing) {
                return (
                  <form
                    key={game.id}
                    action={handleSubmit}
                    className="border rounded-xl p-4 bg-gray-50"
                  >
                    <input type="hidden" name="gameId" value={game.id} />
                    <p className="text-xs text-gray-500 mb-4 break-all">
                      Game ID: {game.id}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`away-team-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Away Team
                        </label>
                        <input
                          id={`away-team-${game.id}`}
                          type="text"
                          name="awayTeam"
                          defaultValue={game.awayTeam}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`home-team-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Home Team
                        </label>
                        <input
                          id={`home-team-${game.id}`}
                          type="text"
                          name="homeTeam"
                          defaultValue={game.homeTeam}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`date-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Date & Time
                        </label>
                        <input
                          id={`date-${game.id}`}
                          type="datetime-local"
                          name="date"
                          defaultValue={localDateString}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`status-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Status
                        </label>
                        <select
                          id={`status-${game.id}`}
                          name="status"
                          defaultValue={game.status}
                          className="w-full border rounded-lg px-3 py-2"
                          required
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="halftime">Halftime</option>
                          <option value="final">Final</option>
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor={`away-score-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Away Score
                        </label>
                        <input
                          id={`away-score-${game.id}`}
                          type="number"
                          name="awayScore"
                          defaultValue={game.awayScore ?? ""}
                          min="0"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`home-score-${game.id}`}
                          className="block text-sm text-gray-600 mb-1"
                        >
                          Home Score
                        </label>
                        <input
                          id={`home-score-${game.id}`}
                          type="number"
                          name="homeScore"
                          defaultValue={game.homeScore ?? ""}
                          min="0"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mt-6">
                          <input
                            type="checkbox"
                            name="isMondayNight"
                            value="true"
                            defaultChecked={game.isMondayNight ?? false}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">
                            Monday Night Game
                          </span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mt-6">
                          <input
                            type="checkbox"
                            name="isTiebreaker"
                            value="true"
                            defaultChecked={game.isTiebreaker ?? false}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-600">
                            Tiebreaker Game
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="submit"
                        disabled={pending}
                        className="px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50"
                      >
                        {pending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGameId(null)}
                        className="px-4 py-2 border rounded-lg"
                        disabled={pending}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={game.id}
                  className="border rounded-xl p-4 flex justify-between items-start"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-lg">
                      {game.awayTeam} @ {game.homeTeam}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(game.date).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      Game ID: {game.id}
                    </div>
                    <div className="text-sm mt-2">
                      <span className="font-medium">Status:</span> {game.status}
                      {game.homeScore !== null && game.awayScore !== null && (
                        <>
                          {" · "}
                          <span className="font-medium">Score:</span>{" "}
                          {game.awayScore} - {game.homeScore}
                        </>
                      )}
                      {game.isMondayNight && (
                        <>
                          {" · "}
                          <span className="text-blue-600 font-medium">
                            Monday Night
                          </span>
                        </>
                      )}
                      {game.isTiebreaker && (
                        <>
                          {" · "}
                          <span className="text-green-600 font-medium">
                            Tiebreaker
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingGameId(game.id)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedSeason && selectedWeek && games.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No games found for Season {selectedSeason}, Week {selectedWeek}
        </div>
      )}

      {!selectedSeason && (
        <div className="text-center py-8 text-gray-500">
          Select a season and week to edit games
        </div>
      )}
    </div>
  );
}

