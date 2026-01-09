// scripts/add-playoff-games.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../db";
import { games } from "../db/schema";

// 2025-26 NFL WILD CARD ROUND - January 10-12, 2026
const playoffGames = [
  // SATURDAY, JANUARY 10
  {
    id: "playoff-2026-wc-1",
    season: 2026,
    week: 19,
    date: new Date("2026-01-10T18:30:00Z"), // Saturday 1:30 PM ET
    homeTeam: "Carolina Panthers",
    awayTeam: "Los Angeles Rams",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-wc-2",
    season: 2026,
    week: 19,
    date: new Date("2026-01-10T22:00:00Z"), // Saturday 5:00 PM ET
    homeTeam: "Chicago Bears",
    awayTeam: "Green Bay Packers",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },

  // SUNDAY, JANUARY 11
  {
    id: "playoff-2026-wc-3",
    season: 2026,
    week: 19,
    date: new Date("2026-01-11T15:00:00Z"), // Sunday 10:00 AM ET
    homeTeam: "Buffalo Bills",
    awayTeam: "Jacksonville Jaguars",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-wc-4",
    season: 2026,
    week: 19,
    date: new Date("2026-01-11T18:30:00Z"), // Sunday 1:30 PM ET
    homeTeam: "Philadelphia Eagles",
    awayTeam: "San Francisco 49ers",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-wc-5",
    season: 2026,
    week: 19,
    date: new Date("2026-01-11T22:15:00Z"), // Sunday 5:15 PM ET
    homeTeam: "New England Patriots",
    awayTeam: "Los Angeles Chargers",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },

  // MONDAY, JANUARY 12
  {
    id: "playoff-2026-wc-6",
    season: 2026,
    week: 19,
    date: new Date("2026-01-12T22:15:00Z"), // Monday 5:15 PM ET (LAST GAME - TIEBREAKER)
    homeTeam: "Houston Texans",
    awayTeam: "Pittsburgh Steelers",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: true,
    isTiebreaker: true, // This is the last game of Wild Card round
  },
];

async function addPlayoffGames() {
  console.log("Adding Wild Card Round games...");

  for (const game of playoffGames) {
    try {
      await db
        .insert(games)
        .values(game)
        .onConflictDoUpdate({
          target: games.id,
          set: {
            season: game.season,
            week: game.week,
            date: game.date,
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            status: game.status,
            homeScore: game.homeScore,
            awayScore: game.awayScore,
            isMondayNight: game.isMondayNight,
            isTiebreaker: game.isTiebreaker,
          },
        });

      console.log(
        `✓ Added: Week ${game.week} - ${game.awayTeam} @ ${game.homeTeam}${
          game.isTiebreaker ? " (TIEBREAKER)" : ""
        }`
      );
    } catch (error) {
      console.error(`✗ Failed to add game ${game.id}:`, error);
    }
  }

  console.log("\nDone! Wild Card Round games added.");
  console.log("\nNote: Add Divisional, Conference, and Super Bowl games after Wild Card results are known.");
}

addPlayoffGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
