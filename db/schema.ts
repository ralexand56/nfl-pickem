// db/schema.ts
import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  unique,
  uuid,
  jsonb,
  primaryKey,
  index,
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
  // Last time they agreed to the Terms and confirmed their age (start/join).
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
});

// --- Groups: each family/office pool is a group. People-generated data
// (picks, tiebreakers, payments, squares) belongs to exactly one group; the
// NFL schedule (games) is shared by everyone.
export const groups = pgTable("groups", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  inviteToken: text("invite_token").notNull().unique(),
  settings: jsonb("settings").notNull().default({}),
  // Never needs to pay for a season. Set only by migration (see 0007).
  compedForever: boolean("comped_forever").notNull().default(false),
  // Where the buyer first came from (see lib/attribution.ts, migration 0009).
  firstTouch: jsonb("first_touch"),
  // Optional auto-renewal via a Stripe subscription (migration 0010).
  autoRenew: boolean("auto_renew").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  renewalReminderSeason: integer("renewal_reminder_season"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type GroupRole = "admin" | "member";

export const groupMembers = pgTable(
  "group_members",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").$type<GroupRole>().notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.groupId, t.userId] }),
    index("group_members_user_idx").on(t.userId),
  ],
);

// A group can play a season once it has a row here: "paid" via Stripe
// Checkout, or "comped" (the original family group).
export const groupSeasons = pgTable(
  "group_seasons",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    season: integer("season").notNull(),
    status: text("status").$type<"paid" | "comped">().notNull(),
    stripeCheckoutSessionId: text("stripe_checkout_session_id").unique(),
    // Set instead for seasons paid by an automatic renewal.
    stripeInvoiceId: text("stripe_invoice_id").unique(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.groupId, t.season] })],
);

const groupIdColumn = () =>
  uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" });

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
    groupId: groupIdColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    gameId: varchar("game_id", { length: 64 }).notNull(),
    pick: text("pick").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("picks_group_user_game_unique").on(t.groupId, t.userId, t.gameId),
  ],
);

// db/schema.ts
export const weeklyTiebreakers = pgTable(
  "weekly_tiebreakers",
  {
    id: serial("id").primaryKey(),
    groupId: groupIdColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    mnfTotalPointsGuess: integer("mnf_total_points_guess").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("weekly_tiebreakers_group_user_season_week_unique").on(
      t.groupId,
      t.userId,
      t.season,
      t.week,
    ),
  ],
);

// Weekly buy-in payments. One row per user per week; updatedBy records who
// last changed it (the player themselves or a payment admin).
export const weeklyPayments = pgTable(
  "weekly_payments",
  {
    id: serial("id").primaryKey(),
    groupId: groupIdColumn(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    season: integer("season").notNull(),
    week: integer("week").notNull(),
    paid: boolean("paid").notNull().default(false),
    // "Cash App", "Zelle", or free text the player typed for "Other"
    method: text("method"),
    updatedBy: uuid("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [
    unique("weekly_payments_group_user_season_week_unique").on(
      t.groupId,
      t.userId,
      t.season,
      t.week,
    ),
  ],
);

// Super Bowl Squares
export const superBowlSquares = pgTable(
  "super_bowl_squares",
  {
    id: serial("id").primaryKey(),
    groupId: groupIdColumn(),
    gameId: text("game_id").notNull().default("default"),
    row: integer("row").notNull(), // 0-9
    col: integer("col").notNull(), // 0-9
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    season: integer("season").notNull(), // e.g., 2026
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    isPaid: boolean("is_paid").default(false),
  },
  (t) => [
    unique("squares_group_game_row_col_unique").on(
      t.groupId,
      t.gameId,
      t.row,
      t.col,
    ),
  ],
);

export const superBowlSquaresConfig = pgTable(
  "super_bowl_squares_config",
  {
    id: serial("id").primaryKey(),
    groupId: groupIdColumn(),
    gameId: text("game_id").notNull().default("default"),
    season: integer("season").notNull(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    homeNumbers: text("home_numbers"), // JSON array of 10 numbers, e.g., "[3,0,7,1,9,4,2,8,5,6]"
    awayNumbers: text("away_numbers"), // JSON array of 10 numbers
    isLocked: boolean("is_locked").default(false), // Lock when numbers are assigned
    pricePerSquare: integer("price_per_square").notNull().default(5),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => [unique("squares_config_group_game_unique").on(t.groupId, t.gameId)],
);

// (your types can remain as-is)

export type SelectGroup = typeof groups.$inferSelect;
export type SelectGroupMember = typeof groupMembers.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertGame = typeof games.$inferInsert;
export type SelectGame = typeof games.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;
export type SelectPick = typeof picks.$inferSelect;
export type InsertWeeklyTiebreaker = typeof weeklyTiebreakers.$inferInsert;
export type SelectWeeklyTiebreaker = typeof weeklyTiebreakers.$inferSelect;
export type InsertWeeklyPayment = typeof weeklyPayments.$inferInsert;
export type SelectWeeklyPayment = typeof weeklyPayments.$inferSelect;
export type InsertSuperBowlSquare = typeof superBowlSquares.$inferInsert;
export type SelectSuperBowlSquare = typeof superBowlSquares.$inferSelect;
export type InsertSuperBowlSquaresConfig =
  typeof superBowlSquaresConfig.$inferInsert;
export type SelectSuperBowlSquaresConfig =
  typeof superBowlSquaresConfig.$inferSelect;
