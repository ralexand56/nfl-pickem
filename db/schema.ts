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
    userId: varchar("user_id", { length: 191 }).notNull(),
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

// (your types can remain as-is)

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;
export type SelectPick = typeof picks.$inferSelect;
export type InsertWeeklyTiebreaker = typeof weeklyTiebreakers.$inferInsert;
export type SelectWeeklyTiebreaker = typeof weeklyTiebreakers.$inferSelect;
