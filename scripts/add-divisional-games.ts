// scripts/add-divisional-games.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.POSTGRES_URL!);

// 2025-26 NFL DIVISIONAL PLAYOFFS - January 17-18, 2026
const divisionalGames = [
  // SATURDAY, JANUARY 17
  {
    id: "playoff-2026-div-1",
    season: 2026,
    week: 20,
    date: new Date("2026-01-17T18:30:00Z"), // Saturday 1:30 PM ET / 10:30 AM PST
    homeTeam: "Denver Broncos",
    awayTeam: "Buffalo Bills",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-div-2",
    season: 2026,
    week: 20,
    date: new Date("2026-01-17T22:00:00Z"), // Saturday 5:00 PM ET / 2:00 PM PST
    homeTeam: "Seattle Seahawks",
    awayTeam: "San Francisco 49ers",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },

  // SUNDAY, JANUARY 18
  {
    id: "playoff-2026-div-3",
    season: 2026,
    week: 20,
    date: new Date("2026-01-18T17:00:00Z"), // Sunday 12:00 PM ET / 9:00 AM PST
    homeTeam: "New England Patriots",
    awayTeam: "Houston Texans",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-div-4",
    season: 2026,
    week: 20,
    date: new Date("2026-01-18T20:30:00Z"), // Sunday 3:30 PM ET / 12:30 PM PST (LAST GAME - TIEBREAKER)
    homeTeam: "Chicago Bears",
    awayTeam: "Los Angeles Rams",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: true, // This is the last game of Divisional round
  },
];

async function addDivisionalGames() {
  console.log("Adding Divisional Round games...");

  for (const game of divisionalGames) {
    try {
      await sql`
        INSERT INTO games (id, season, week, date, home_team, away_team, status, home_score, away_score, is_monday_night, is_tiebreaker)
        VALUES (
          ${game.id},
          ${game.season},
          ${game.week},
          ${game.date.toISOString()},
          ${game.homeTeam},
          ${game.awayTeam},
          ${game.status},
          ${game.homeScore},
          ${game.awayScore},
          ${game.isMondayNight},
          ${game.isTiebreaker}
        )
        ON CONFLICT (id) DO UPDATE SET
          season = ${game.season},
          week = ${game.week},
          date = ${game.date.toISOString()},
          home_team = ${game.homeTeam},
          away_team = ${game.awayTeam},
          status = ${game.status},
          home_score = ${game.homeScore},
          away_score = ${game.awayScore},
          is_monday_night = ${game.isMondayNight},
          is_tiebreaker = ${game.isTiebreaker}
      `;

      console.log(
        `✓ Added: Week ${game.week} - ${game.awayTeam} @ ${game.homeTeam}${
          game.isTiebreaker ? " (TIEBREAKER)" : ""
        }`
      );
    } catch (error) {
      console.error(`✗ Failed to add game ${game.id}:`, error);
    }
  }

  console.log("\nDone! Divisional Round games added.");
}

addDivisionalGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
