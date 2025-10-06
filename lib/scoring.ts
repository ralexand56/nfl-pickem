import { type InferSelectModel } from "drizzle-orm";
import {
  games as gamesTable,
  picks as picksTable,
  weeklyTiebreakers as tbTable,
} from "@/db/schema";

type Game = InferSelectModel<typeof gamesTable>;
type Pick = InferSelectModel<typeof picksTable>;
type TB = InferSelectModel<typeof tbTable>;

export function computeWeekWinners(games: Game[]) {
  const winners: Record<string, "HOME" | "AWAY" | null> = {};
  for (const g of games) {
    if (g.status !== "final" || g.homeScore == null || g.awayScore == null) {
      winners[g.id] = null;
      continue;
    }
    winners[g.id] = g.homeScore > g.awayScore ? "HOME" : "AWAY";
  }
  return winners;
}

export function scoreUser(
  userId: string,
  games: Game[],
  picks: Pick[],
  tiebreaker: TB | null
) {
  const winners = computeWeekWinners(games);
  let correct = 0;
  for (const p of picks.filter((p) => p.userId === userId)) {
    const w = winners[p.gameId];
    if (w && w === p.pick) correct++;
  }
  const mnf = games.find(
    (g) =>
      g.isMondayNight &&
      g.status === "final" &&
      g.homeScore != null &&
      g.awayScore != null
  );
  let tieDistance: number | null = null;
  if (mnf && tiebreaker) {
    const actualTotal = mnf.homeScore! + mnf.awayScore!;
    tieDistance = Math.abs(actualTotal - tiebreaker.mnfTotalPointsGuess);
  }
  const tb = tiebreaker ? tiebreaker.mnfTotalPointsGuess : null;
  return { correct, tieDistance, tb };
}
