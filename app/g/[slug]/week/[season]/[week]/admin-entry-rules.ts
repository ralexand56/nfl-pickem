import { tiebreakerDeadlineMs } from "@/lib/group-settings";

// When the tiebreaker game itself kicks off. Admins can enter a missing guess
// until then, whatever the group's own tiebreaker deadline is.
export function tiebreakerGameKickoffMs(
  weekGames: { date: Date | string; isTiebreaker?: boolean | null }[]
) {
  return tiebreakerDeadlineMs("game", weekGames);
}

// A game an admin can still fill in for someone: it hasn't kicked off.
export function gameStillOpen(game: { date: Date | string; status: string }, nowMs: number) {
  return game.status === "scheduled" && nowMs < new Date(game.date).getTime();
}
