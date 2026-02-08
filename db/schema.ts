// db/schema.ts
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- USERS (UUID with default + emailVerified) ---
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { withTimezone: true }),
  image: text("image"),
});

// --- Your app tables (reference users.id as UUID) ---
export const games = pgTable("games", {
  id: varchar("id", { length: 64 }).primaryKey(),
  season: integer("season").notNull(),
  week: integer("week").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  status: text("status").notNull().default("scheduled"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  isMondayNight: boolean("is_monday_night").default(false),
  isTiebreaker: boolean("is_tiebreaker").default(false),
});

export const picks = pgTable(
  "picks",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: varchar("game_id", { length: 64 }).notNull(),
    pick: text("pick").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    {
      userGameUnique: uniqueIndex("picks_user_game_unique").on(
        t.userId,
        t.gameId
      ),
    },
  ]
);

// db/schema.ts
export const weeklyTiebreakers = pgTable(
  "weekly_tiebreakers",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    mnfTotalPointsGuess: integer("mnf_total_points_guess").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    {
      uniq: uniqueIndex("uniq_user_season_week").on(t.userId, t.season, t.week),
    },
  ]
);

// Super Bowl Squares
export const superBowlSquares = pgTable(
  "super_bowl_squares",
  {
    id: serial("id").primaryKey(),
    gameId: text("game_id").notNull().default("default"),
    row: integer("row").notNull(), // 0-9
    col: integer("col").notNull(), // 0-9
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    season: integer("season").notNull(), // e.g., 2026
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    isPaid: boolean("is_paid").default(false),
  },
  (t) => [
    {
      rowColGameUnique: uniqueIndex("squares_row_col_game_unique").on(
        t.row,
        t.col,
        t.gameId
      ),
    },
  ]
);

export const superBowlSquaresConfig = pgTable("super_bowl_squares_config", {
  id: serial("id").primaryKey(),
  gameId: text("game_id").notNull().unique().default("default"),
  season: integer("season").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeNumbers: text("home_numbers"), // JSON array of 10 numbers, e.g., "[3,0,7,1,9,4,2,8,5,6]"
  awayNumbers: text("away_numbers"), // JSON array of 10 numbers
  isLocked: boolean("is_locked").default(false), // Lock when numbers are assigned
  pricePerSquare: integer("price_per_square").notNull().default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// (your types can remain as-is)

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;
export type SelectPick = typeof picks.$inferSelect;
export type InsertWeeklyTiebreaker = typeof weeklyTiebreakers.$inferInsert;
export type SelectWeeklyTiebreaker = typeof weeklyTiebreakers.$inferSelect;
export type InsertSuperBowlSquare = typeof superBowlSquares.$inferInsert;
export type SelectSuperBowlSquare = typeof superBowlSquares.$inferSelect;
export type InsertSuperBowlSquaresConfig =
  typeof superBowlSquaresConfig.$inferInsert;
export type SelectSuperBowlSquaresConfig =
  typeof superBowlSquaresConfig.$inferSelect;
