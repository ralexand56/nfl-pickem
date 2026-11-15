"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useGroup } from "@/components/GroupProvider";
import { useToast } from "@/components/Toast";
import { enterMissedPickAction, enterMissedTiebreakerAction } from "./actions";
import { gameStillOpen, tiebreakerGameKickoffMs } from "./admin-entry-rules";

type Game = {
  id: string;
  date: Date | string;
  status: string;
  homeTeam: string;
  awayTeam: string;
  isTiebreaker: boolean | null;
};

export type EntryMember = {
  id: string;
  name: string;
  pickedGameIds: string[];
  hasTiebreaker: boolean;
};

// What an admin could still fill in for one member right now: games they
// haven't picked that haven't kicked off, and a missing tiebreaker guess
// before the tiebreaker game starts.
export function missedEntries(
  member: EntryMember,
  games: Game[],
  tiebreakerEnabled: boolean,
  nowMs: number
) {
  const picked = new Set(member.pickedGameIds);
  const openGames = games
    .filter((g) => !picked.has(g.id) && gameStillOpen(g, nowMs))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const tiebreakerOpen =
    tiebreakerEnabled &&
    !member.hasTiebreaker &&
    games.length > 0 &&
    nowMs < tiebreakerGameKickoffMs(games);
  return { openGames, tiebreakerOpen };
}

// Admin only. Fills in picks a member missed, for games that haven't started.
// It only shows what's missing, so it never reveals or changes a pick.
export function AdminPickEntry({
  members,
  games,
  nowMs,
  season,
  week,
  onClose,
}: {
  members: EntryMember[];
  games: Game[];
  nowMs: number;
  season: number;
  week: number;
  onClose: () => void;
}) {
  const group = useGroup();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [guess, setGuess] = useState("");
  const member = members.find((m) => m.id === memberId) ?? members[0];
  const { openGames, tiebreakerOpen } = member
    ? missedEntries(member, games, group.settings.tiebreakerEnabled, nowMs)
    : { openGames: [], tiebreakerOpen: false };

  function run(work: () => Promise<void>, done: string) {
    start(async () => {
      try {
        await work();
        toast.success(done);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save that");
      }
    });
  }

  function enterPick(game: Game, side: "HOME" | "AWAY") {
    const team = side === "HOME" ? game.homeTeam : game.awayTeam;
    run(
      () => enterMissedPickAction(group.slug, season, week, member.id, game.id, side),
      `Saved ${team} for ${member.name}`
    );
  }

  function enterTiebreaker() {
    const value = Number(guess);
    run(async () => {
      await enterMissedTiebreakerAction(group.slug, season, week, member.id, value);
      setGuess("");
    }, `Saved tiebreaker for ${member.name}`);
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="font-semibold text-text">Enter a missed pick</h3>
      <p className="text-sm text-text-muted mb-3">
        For someone who asks you to add a pick they forgot. Only games that
        haven&apos;t kicked off, and only picks they haven&apos;t made, so
        nothing they already picked can change.
      </p>

      {members.length === 0 ? (
        <p className="text-sm text-text">Nobody is missing a pick for a game that hasn&apos;t started.</p>
      ) : (
        <>
          <label className="flex flex-wrap items-center gap-2 text-sm text-text mb-3">
            Member
            <select
              value={member?.id}
              onChange={(e) => setMemberId(e.target.value)}
              disabled={pending}
              className="min-w-0 max-w-full px-2 py-1 rounded-control border border-border bg-surface text-sm text-text"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          <ul className="grid gap-2">
            {openGames.map((g) => (
              <li
                key={g.id}
                className="flex flex-col gap-2 rounded-control border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-text">
                  {g.awayTeam} @ {g.homeTeam}
                </span>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => enterPick(g, "AWAY")}>
                    {g.awayTeam}
                  </Button>
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => enterPick(g, "HOME")}>
                    {g.homeTeam}
                  </Button>
                </div>
              </li>
            ))}
            {tiebreakerOpen && (
              <li className="flex flex-wrap items-center gap-2 rounded-control border border-border p-3">
                <label htmlFor="admin-tiebreaker" className="text-sm text-text">
                  Tiebreaker guess
                </label>
                <Input
                  id="admin-tiebreaker"
                  type="number"
                  inputMode="numeric"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder="Total points"
                  className="w-32"
                  disabled={pending}
                />
                <Button size="sm" variant="primary" disabled={pending || guess === ""} onClick={enterTiebreaker}>
                  Save
                </Button>
              </li>
            )}
          </ul>
        </>
      )}

      <Button variant="secondary" size="sm" className="mt-3" onClick={onClose} disabled={pending}>
        Done
      </Button>
    </div>
  );
}
