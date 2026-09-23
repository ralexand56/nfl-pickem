"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";

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
  const router = useRouter();

  const uid = session?.user?.id;

  const [pending, start] = useTransition();
  const [myTB, setMyTB] = useState<number | "">(
    tiebreakers.find((t) => t.userId === uid)?.mnfTotalPointsGuess ?? ""
  );
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [tbSaving, setTbSaving] = useState(false);
  const [tbSaved, setTbSaved] = useState(false);
  const tbDirtyRef = useRef(false);

  useEffect(() => {
    // Don't clobber an in-progress, unsaved edit when the page refreshes
    // for an unrelated reason (e.g. saving a pick elsewhere on this page).
    if (tbDirtyRef.current) return;
    setMyTB(
      tiebreakers.find((t) => t.userId === uid)?.mnfTotalPointsGuess ?? ""
    );
  }, [tiebreakers, uid]);

  // Ticking clock for live countdown
  useEffect(() => {
    const intervalId = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const myPicks = Object.fromEntries(
    allPicks
      .filter((p) => p.picks.userId === uid)
      .map((p) => [p.picks.gameId, p.picks.pick])
  );

  async function pick(gameId: string, pick: "HOME" | "AWAY") {
    setError(null);
    start(async () => {
      try {
        const res = await fetch("/api/picks", {
          method: "POST",
          body: JSON.stringify({ gameId, pick }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error ?? "Failed to save pick");
          return;
        }
        router.refresh();
      } catch {
        setError("Failed to save pick");
      }
    });
  }

  async function saveTB() {
    if (myTB === "") return;
    setError(null);
    setTbSaved(false);
    setTbSaving(true);
    try {
      const res = await fetch("/api/tiebreaker", {
        method: "POST",
        body: JSON.stringify({ season, week, mnfTotalPointsGuess: Number(myTB) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Failed to save tiebreaker");
        if (res.status === 409) {
          tbDirtyRef.current = false;
          setMyTB("");
        }
        return;
      }
      tbDirtyRef.current = false;
      router.refresh();
      setTbSaved(true);
      setTimeout(() => setTbSaved(false), 3000);
    } catch {
      setError("Failed to save tiebreaker");
    } finally {
      setTbSaving(false);
    }
  }

  // Determine if the cutoff (first game of the week) has passed in user's local time
  const firstGameTimeMs = useMemo(() => {
    if (!games.length) return null;
    return Math.min(...games.map((g) => new Date(g.date).getTime()));
  }, [games]);
  const msRemaining = firstGameTimeMs == null ? null : firstGameTimeMs - nowMs;
  const cutoffPassed = msRemaining != null ? msRemaining <= 0 : false;

  function formatRemaining(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4 text-text">
        Week {week} · {season} {pending && "(updating...)"}
      </h2>

      {error && (
        <Card className="mb-6 bg-danger-muted border-transparent">
          <div className="text-danger">{error}</div>
        </Card>
      )}

      {firstGameTimeMs != null && (
        <Card
          className={clsx(
            "mb-6",
            cutoffPassed ? "bg-surface-muted" : "bg-warning-muted border-transparent"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-text">
              {cutoffPassed ? "Picks closed" : "Time remaining to make your picks"}
            </div>
            <div className="text-sm text-text">
              {cutoffPassed ? "00:00:00" : formatRemaining(msRemaining!)}
            </div>
          </div>
        </Card>
      )}

      <Card className="mb-6">
        <h3 className="font-semibold mb-2 text-text">
          Tiebreaker (total points in last game)
        </h3>
        <div className="flex gap-2 items-center">
          <label htmlFor="mnf-tiebreaker" className="sr-only">
            Tiebreaker Total Points
          </label>
          <Input
            id="mnf-tiebreaker"
            type="number"
            value={myTB}
            placeholder="Enter total points"
            title="Tiebreaker Total Points"
            disabled={!uid}
            onChange={(e) => {
              tbDirtyRef.current = true;
              setMyTB(e.target.value === "" ? "" : Number(e.target.value));
              setTbSaved(false);
            }}
          />
          <Button variant="primary" onClick={saveTB} disabled={!uid || tbSaving}>
            {tbSaving ? "Saving…" : "Save"}
          </Button>
          {tbSaved && <span className="text-sm text-success">Saved</span>}
        </div>
        {!uid && (
          <div className="text-sm text-text-muted mt-2">
            Sign in to enter a tiebreaker.
          </div>
        )}
      </Card>

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
              <Card
                key={g.id}
                className={clsx(g.isTiebreaker && "bg-surface-muted")}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-text-muted">
                      {new Date(g.date).toLocaleString()}
                    </div>
                    <div className="font-semibold text-text flex items-center gap-2">
                      {g.awayTeam} @ {g.homeTeam}
                      {g.isTiebreaker && <Badge tone="brand">tiebreaker</Badge>}
                    </div>
                    {g.status === "final" && (
                      <div className="text-sm mt-1 text-text">
                        Final: {g.awayScore} - {g.homeScore}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!uid || g.status === "final" || pending || cutoffPassed}
                      onClick={() => pick(g.id, "AWAY")}
                      className={clsx(
                        "px-3 py-2 rounded-control border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        mine === "AWAY"
                          ? "bg-brand-600 text-white border-transparent"
                          : "border-border hover:bg-surface-muted text-text",
                        awayWon && "ring-2 ring-success"
                      )}
                      title={cutoffPassed ? "Picks are closed for this week" : undefined}
                    >
                      {g.awayTeam}
                    </button>
                    <button
                      disabled={!uid || g.status === "final" || pending || cutoffPassed}
                      onClick={() => pick(g.id, "HOME")}
                      className={clsx(
                        "px-3 py-2 rounded-control border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        mine === "HOME"
                          ? "bg-brand-600 text-white border-transparent"
                          : "border-border hover:bg-surface-muted text-text",
                        homeWon && "ring-2 ring-success"
                      )}
                      title={cutoffPassed ? "Picks are closed for this week" : undefined}
                    >
                      {g.homeTeam}
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm text-text-muted">
                  <span className="font-medium text-text">All picks:</span>{" "}
                  {allPicks
                    .filter((p) => p.picks.gameId === g.id)
                    .map((p) => (
                      <span
                        key={p.picks.id}
                        className={clsx(
                          "inline-block px-2 py-1 rounded-full border border-border mx-1",
                          p.picks.userId === uid && "bg-surface-muted"
                        )}
                      >
                        {(p.users.name ?? "Unknown").slice(0, 6)}:{" "}
                        {p.picks.pick}
                      </span>
                    ))}
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}