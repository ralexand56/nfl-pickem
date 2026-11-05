"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/Toast";
import WeekStatusBadge from "@/components/WeekStatusBadge";
import { useGroup } from "@/components/GroupProvider";
import { pickDeadlineMs, tiebreakerDeadlineMs } from "@/lib/group-settings";
import { getPickStatus } from "@/lib/pick-status";
import { getWeekLabel, type WeekStatus } from "@/lib/weeks";
import { PickStatusBar, WhosIn } from "./pick-progress";

// Extend the session user type to include 'id'
import type { DefaultSession } from "next-auth";
import {
  SelectGame,
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
  members,
  season,
  week,
  weekStatus,
  paymentTracker,
}: {
  games: SelectGame[];
  allPicks: { picks: SelectPick; users: { name: string | null } }[];
  tiebreakers: SelectWeeklyTiebreaker[];
  members: {
    id: string;
    name: string;
    pickedGameIds: string[];
    hasTiebreaker: boolean;
  }[];
  season: number;
  week: number;
  weekStatus?: WeekStatus | null;
  paymentTracker?: ReactNode;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const toast = useToast();
  const group = useGroup();
  const { tiebreakerEnabled, pickDeadline, tiebreakerDeadline, hidePicksUntilLock } =
    group.settings;

  const uid = session?.user?.id;

  const [pending, start] = useTransition();
  const [myTB, setMyTB] = useState<number | "">(
    tiebreakers.find((t) => t.userId === uid)?.mnfTotalPointsGuess ?? ""
  );
  const [nowMs, setNowMs] = useState<number>(Date.now());
  const [tbSaving, setTbSaving] = useState(false);
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

  const memberStatuses = members.map((m) => ({
    id: m.id,
    name: m.name,
    status: getPickStatus({
      games,
      pickedGameIds: new Set(m.pickedGameIds),
      hasTiebreaker: m.hasTiebreaker,
      settings: group.settings,
      nowMs,
    }),
  }));
  const myStatus = memberStatuses.find((m) => m.id === uid)?.status;
  const tiebreakerLocked =
    games.length > 0 && nowMs >= tiebreakerDeadlineMs(tiebreakerDeadline, games);

  async function pick(gameId: string, pick: "HOME" | "AWAY") {
    const game = games.find((g) => g.id === gameId);
    const team = pick === "HOME" ? game?.homeTeam : game?.awayTeam;
    start(async () => {
      try {
        const res = await fetch("/api/picks", {
          method: "POST",
          body: JSON.stringify({ group: group.slug, gameId, pick }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          toast.error(body?.error ?? "Failed to save pick");
          return;
        }
        router.refresh();
        toast.success(team ? `Pick saved: ${team}` : "Pick saved");
      } catch {
        toast.error("Failed to save pick");
      }
    });
  }

  async function saveTB() {
    if (myTB === "") return;
    setTbSaving(true);
    try {
      const res = await fetch("/api/tiebreaker", {
        method: "POST",
        body: JSON.stringify({
          group: group.slug,
          season,
          week,
          mnfTotalPointsGuess: Number(myTB),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Failed to save tiebreaker");
        if (res.status === 409) {
          tbDirtyRef.current = false;
          setMyTB("");
        }
        return;
      }
      tbDirtyRef.current = false;
      router.refresh();
      toast.success("Tiebreaker saved");
    } catch {
      toast.error("Failed to save tiebreaker");
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
      <h2 className="text-2xl font-semibold mb-4 text-text flex items-center gap-3">
        <span>
          Week {week} · {season} {pending && "(updating...)"}
        </span>
        <WeekStatusBadge status={weekStatus ?? null} />
      </h2>

      {firstGameTimeMs != null && (
        <Card
          className={clsx(
            "mb-6",
            cutoffPassed ? "bg-surface-muted" : "bg-warning-muted border-transparent"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-text">
              {pickDeadline === "game"
                ? cutoffPassed
                  ? "First game has started. Later games stay open until their kickoff."
                  : "Time until the first game locks"
                : cutoffPassed
                  ? "Picks closed"
                  : "Time remaining to make your picks"}
            </div>
            <div className="text-sm text-text">
              {cutoffPassed ? "00:00:00" : formatRemaining(msRemaining!)}
            </div>
          </div>
        </Card>
      )}

      {games.length > 0 && <WhosIn members={memberStatuses} viewerId={uid} />}

      {paymentTracker}

      {tiebreakerEnabled && (
      <Card className="mb-6 scroll-mt-32" data-pick-target>
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
            disabled={!uid || tiebreakerLocked}
            onChange={(e) => {
              tbDirtyRef.current = true;
              setMyTB(e.target.value === "" ? "" : Number(e.target.value));
            }}
          />
          <Button variant="primary" onClick={saveTB} disabled={!uid || tbSaving || tiebreakerLocked}>
            {tbSaving ? "Saving…" : "Save"}
          </Button>
        </div>
        {!uid && (
          <div className="text-sm text-text-muted mt-2">
            Sign in to enter a tiebreaker.
          </div>
        )}
        {tiebreakerLocked && (
          <div className="text-sm text-text-muted mt-2">
            The tiebreaker is locked for this week.
          </div>
        )}
      </Card>
      )}

      <div className="grid gap-3">
        {games
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((g) => {
            const mine = myPicks[g.id] as "HOME" | "AWAY" | undefined;
            const locked = nowMs >= pickDeadlineMs(pickDeadline, g, games);
            const lockedTitle = locked
              ? pickDeadline === "game"
                ? "This game has started"
                : "Picks are closed for this week"
              : undefined;
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
                id={`game-${g.id}`}
                className={clsx("scroll-mt-32", g.isTiebreaker && "bg-surface-muted")}
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
                      disabled={!uid || g.status === "final" || pending || locked}
                      onClick={() => pick(g.id, "AWAY")}
                      className={clsx(
                        "px-3 py-2 rounded-control border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        mine === "AWAY"
                          ? "bg-brand-600 text-white border-transparent"
                          : "border-border hover:bg-surface-muted text-text",
                        awayWon && "ring-2 ring-success"
                      )}
                      title={lockedTitle}
                    >
                      {g.awayTeam}
                    </button>
                    <button
                      disabled={!uid || g.status === "final" || pending || locked}
                      onClick={() => pick(g.id, "HOME")}
                      className={clsx(
                        "px-3 py-2 rounded-control border cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                        mine === "HOME"
                          ? "bg-brand-600 text-white border-transparent"
                          : "border-border hover:bg-surface-muted text-text",
                        homeWon && "ring-2 ring-success"
                      )}
                      title={lockedTitle}
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
                  {hidePicksUntilLock && !locked && g.status !== "final" && (
                    <span className="ml-1">Others stay hidden until picks lock.</span>
                  )}
                </div>
              </Card>
            );
          })}
      </div>

      {myStatus && myStatus.total > 0 && (
        <PickStatusBar
          status={myStatus}
          weekLabel={getWeekLabel(week)}
          tiebreakerInputId="mnf-tiebreaker"
        />
      )}
    </div>
  );
}