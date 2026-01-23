// scripts/add-conference-games.ts
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.POSTGRES_URL!);

// 2025-26 NFL CONFERENCE CHAMPIONSHIPS - January 25, 2026
const conferenceGames = [
  // SUNDAY, JANUARY 25
  {
    id: "playoff-2026-conf-1",
    season: 2026,
    week: 21,
    date: new Date("2026-01-25T20:00:00Z"), // Sunday 12:00 PM PST / 3:00 PM ET
    homeTeam: "Denver Broncos",
    awayTeam: "New England Patriots",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: false,
  },
  {
    id: "playoff-2026-conf-2",
    season: 2026,
    week: 21,
    date: new Date("2026-01-25T23:30:00Z"), // Sunday 3:30 PM PST / 6:30 PM ET (LAST GAME - TIEBREAKER)
    homeTeam: "Seattle Seahawks",
    awayTeam: "Los Angeles Rams",
    status: "scheduled" as const,
    homeScore: null,
    awayScore: null,
    isMondayNight: false,
    isTiebreaker: true, // This is the last game of Conference Championship round
  },
];

async function addConferenceGames() {
  console.log("Adding Conference Championship games...");

  for (const game of conferenceGames) {
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

  console.log("\nDone! Conference Championship games added.");
}

addConferenceGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
