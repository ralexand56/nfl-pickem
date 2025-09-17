import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";
// Import or define the users table before referencing it below
import { users } from "./schema"; // Adjust the path as needed

/** OAuth Accounts */
export const accounts = pgTable(
  "accounts",
  {
    userId: varchar("userId", { length: 191 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    {
      pk: primaryKey({ columns: [t.provider, t.providerAccountId] }),
    },
  ]
);

/** Database sessions (only if you use database session strategy) */
export const sessions = pgTable("sessions", {
  sessionToken: varchar("sessionToken", { length: 255 }).primaryKey(),
  userId: varchar("userId", { length: 191 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

/** Email/Magic-link tokens (only if you use magic links) */
export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [
    {
      pk: primaryKey({ columns: [t.identifier, t.token] }),
    },
  ]
);
