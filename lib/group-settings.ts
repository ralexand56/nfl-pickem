// Per-group settings stored in groups.settings (jsonb). Client-safe: the
// admin form, the server actions that save it, and the pages that obey it all
// share this schema. Missing keys fall back to the defaults, so adding a new
// setting never needs a data migration.
import { z } from "zod";
import { MAX_METHOD_LENGTH } from "@/lib/payment-methods";

export const PICK_DEADLINES = {
  week: "Before the first kickoff of the week",
  game: "Before each game's own kickoff",
} as const;

export const TIEBREAKER_DEADLINES = {
  game: "Before the tiebreaker game kicks off",
  week: "Before the first kickoff of the week",
} as const;

export const groupSettingsSchema = z.object({
  // Super Bowl squares page and nav link.
  squaresEnabled: z.boolean().default(true),
  // Weekly buy-in tracker on the picks and leaderboard pages.
  buyInEnabled: z.boolean().default(true),
  buyInAmount: z.number().int().min(0).max(10_000).default(5),
  paymentMethods: z
    .array(z.string().trim().min(1).max(MAX_METHOD_LENGTH))
    .max(8)
    .default(["Cash App", "Zelle"]),
  // Game rules.
  tiebreakerEnabled: z.boolean().default(true),
  tiebreakerDeadline: z
    .enum(Object.keys(TIEBREAKER_DEADLINES) as [keyof typeof TIEBREAKER_DEADLINES])
    .default("game"),
  // Email members who started but haven't finished about an hour before
  // picks lock.
  autoRemindersEnabled: z.boolean().default(true),
  // Keep other members' picks and tiebreaker guesses private until they lock.
  hidePicksUntilLock: z.boolean().default(false),
  // Keep other members' tiebreaker guesses private until the tiebreaker
  // locks, even when picks are visible.
  hideTiebreakersUntilLock: z.boolean().default(false),
  includePlayoffs: z.boolean().default(true),
  pickDeadline: z
    .enum(Object.keys(PICK_DEADLINES) as [keyof typeof PICK_DEADLINES])
    .default("week"),
});

export type GroupSettings = z.infer<typeof groupSettingsSchema>;

// Tolerates bad or partial stored JSON: anything invalid falls back to the
// defaults rather than breaking the group's pages.
export function parseGroupSettings(raw: unknown): GroupSettings {
  const parsed = groupSettingsSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : groupSettingsSchema.parse({});
}

// The pick deadline for one game under the group's rule.
export function pickDeadlineMs(
  rule: GroupSettings["pickDeadline"],
  game: { date: Date | string },
  weekGames: { date: Date | string }[]
) {
  if (rule === "game") return new Date(game.date).getTime();
  return Math.min(...weekGames.map((g) => new Date(g.date).getTime()));
}

// When the tiebreaker locks under the group's rule. The tiebreaker game is the
// flagged one, or the week's last game if none is flagged.
export function tiebreakerDeadlineMs(
  rule: GroupSettings["tiebreakerDeadline"],
  weekGames: { date: Date | string; isTiebreaker?: boolean | null }[]
) {
  const kickoffs = weekGames.map((g) => new Date(g.date).getTime());
  if (rule === "week") return Math.min(...kickoffs);
  const flagged = weekGames.find((g) => g.isTiebreaker);
  return flagged ? new Date(flagged.date).getTime() : Math.max(...kickoffs);
}

// New groups start with the money-related features off; admins opt in.
// (Defaults above stay on so groups saved before this keep their behavior.)
export const NEW_GROUP_SETTINGS: Partial<GroupSettings> = {
  buyInEnabled: false,
  squaresEnabled: false,
};

/** Whether other members' tiebreaker guesses stay private until it locks. */
export function hidesTiebreakerGuesses(
  settings: Pick<GroupSettings, "hidePicksUntilLock" | "hideTiebreakersUntilLock">
): boolean {
  return settings.hidePicksUntilLock || settings.hideTiebreakersUntilLock;
}
