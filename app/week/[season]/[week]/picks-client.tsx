"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useTransition } from "react";

// Extend the session user type to include 'id'
import type { DefaultSession } from "next-auth";
import {
  SelectGame,
  SelectUser,
  SelectPick,
  SelectWeeklyTiebreaker,
} from "@/db/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export default function PicksClient({
  games,
  allPicks,
  tiebreakers,
  season,
  week,
}: {
  games: SelectGame[];
  allPicks: { picks: SelectPick; users: SelectUser }[];
  tiebreakers: SelectWeeklyTiebreaker[];
  season: number;
  week: number;
}) {
  const { data: session } = useSession();

  const uid = session?.user?.id;

  const [pending, start] = useTransition();
  const [myTB, setMyTB] = useState<number | "">(
    tiebreakers.find((t) => t.userId === uid)?.mnfTotalPointsGuess ?? ""
  );

  useEffect(() => {
    setMyTB(
      tiebreakers.find((t) => t.userId === uid)?.mnfTotalPointsGuess ?? ""
    );

    return () => {
      setMyTB("");
    };
  }, [tiebreakers, uid]);

  const myPicks = Object.fromEntries(
    allPicks
      .filter((p) => p.picks.userId === uid)
      .map((p) => [p.picks.gameId, p.picks.pick])
  );

  async function pick(gameId: string, pick: "HOME" | "AWAY") {
    start(async () => {
      await fetch("/api/picks", {
        method: "POST",
        body: JSON.stringify({ gameId, pick }),
      });
      location.reload();
    });
  }

  async function saveTB() {
    if (myTB === "") return;
    await fetch("/api/tiebreaker", {
      method: "POST",
      body: JSON.stringify({ season, week, mnfTotalPointsGuess: Number(myTB) }),
    });
    location.reload();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Week {week} · {season} {pending && "(updating...)"}
      </h2>

      <div className="rounded-xl border mb-6 p-4">
        <h3 className="font-semibold mb-2">
          Monday Night Tiebreaker (total points)
        </h3>
        <div className="flex gap-2 items-center">
          <label htmlFor="mnf-tiebreaker" className="sr-only">
            Monday Night Tiebreaker Total Points
          </label>
          <input
            id="mnf-tiebreaker"
            type="number"
            className="border rounded-lg px-3 py-2"
            value={myTB}
            placeholder="Enter total points"
            title="Monday Night Tiebreaker Total Points"
            onChange={(e) =>
              setMyTB(e.target.value === "" ? "" : Number(e.target.value))
            }
          />
          <button
            onClick={saveTB}
            className="rounded-lg px-4 py-2 bg-black text-white"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {games
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((g) => {
            const mine = myPicks[g.id] as "HOME" | "AWAY" | undefined;
            const homeWon =
              g.status === "final" &&
              g.homeScore !== null &&
              g.awayScore !== null &&
              g.homeScore > g.awayScore;
            const awayWon =
              g.status === "final" &&
              g.homeScore !== null &&
              g.awayScore !== null &&
              g.awayScore > g.homeScore;
            return (
              <div key={g.id} className="border rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">
                      {new Date(g.date).toLocaleString()}
                    </div>
                    <div className="font-semibold">
                      {g.awayTeam} @ {g.homeTeam}{" "}
                      {g.isMondayNight && "(tiebreaker)"}
                    </div>
                    {g.status === "final" && (
                      <div className="text-sm mt-1">
                        Final: {g.awayScore} - {g.homeScore}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!uid || g.status === "final" || pending}
                      onClick={() => pick(g.id, "AWAY")}
                      className={`px-3 py-2 rounded-lg border ${
                        mine === "AWAY" ? "bg-black text-white" : ""
                      } ${awayWon ? "ring-2 ring-green-500" : ""}`}
                    >
                      {g.awayTeam}
                    </button>
                    <button
                      disabled={!uid || g.status === "final" || pending}
                      onClick={() => pick(g.id, "HOME")}
                      className={`px-3 py-2 rounded-lg border ${
                        mine === "HOME" ? "bg-black text-white" : ""
                      } ${homeWon ? "ring-2 ring-green-500" : ""}`}
                    >
                      {g.homeTeam}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <span className="font-medium">All picks:</span>{" "}
                  {allPicks
                    .filter((p) => p.picks.gameId === g.id)
                    .map((p) => (
                      <span
                        key={p.picks.id}
                        className={`inline-block px-2 py-1 rounded-full border mx-1 ${
                          p.picks.userId === uid ? "bg-gray-100" : ""
                        }`}
                      >
                        {(p.users.name ?? "Unknown").slice(0, 6)}:{" "}
                        {p.picks.pick}
                      </span>
                    ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
