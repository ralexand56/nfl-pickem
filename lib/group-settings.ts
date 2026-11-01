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

// New groups start with the money-related features off; admins opt in.
// (Defaults above stay on so groups saved before this keep their behavior.)
export const NEW_GROUP_SETTINGS: Partial<GroupSettings> = {
  buyInEnabled: false,
  squaresEnabled: false,
};
