// When automatic pick reminders go out, and what each one is about. Pure, so
// it can be checked without a database.
import {
  pickDeadlineMs,
  tiebreakerDeadlineMs,
  type GroupSettings,
} from "@/lib/group-settings";

const MINUTE = 60 * 1000;
// A reminder is sent by the first scheduler run that lands 15–75 minutes
// before a lock. Runs come about every 15 minutes, so most arrive about an
// hour ahead; a late run still sends, but never in the last 15 minutes.
export const REMIND_MIN_LEAD_MS = 15 * MINUTE;
export const REMIND_MAX_LEAD_MS = 75 * MINUTE;
// Locks this close together share one reminder (one per game day), sent
// before the first of them.
const SAME_DAY_MS = 16 * 60 * MINUTE;
// Skip anyone an admin reminded by hand this recently.
export const RECENT_MANUAL_MS = 3 * 60 * MINUTE;

type Game = {
  id: string;
  date: Date | string;
  status?: string | null;
  isTiebreaker?: boolean | null;
};
type Settings = Pick<
  GroupSettings,
  "pickDeadline" | "tiebreakerEnabled" | "tiebreakerDeadline"
>;

// The moments a reminder can be about: each pick deadline (one per game day)
// and the tiebreaker deadline.
export function reminderLocks(games: Game[], settings: Settings): number[] {
  if (games.length === 0) return [];
  const deadlines = games.map((g) => pickDeadlineMs(settings.pickDeadline, g, games));
  if (settings.tiebreakerEnabled) {
    deadlines.push(tiebreakerDeadlineMs(settings.tiebreakerDeadline, games));
  }
  const sorted = Array.from(new Set(deadlines)).sort((a, b) => a - b);
  const locks: number[] = [];
  for (const d of sorted) {
    if (locks.length === 0 || d >= locks[locks.length - 1] + SAME_DAY_MS) locks.push(d);
  }
  return locks;
}

export function isReminderDue(lockAt: number, nowMs: number) {
  const lead = lockAt - nowMs;
  return lead >= REMIND_MIN_LEAD_MS && lead <= REMIND_MAX_LEAD_MS;
}

// What a member still needs to do before (or on the same game day as) a lock.
export function dueAtLock({
  lockAt,
  games,
  settings,
  pickedGameIds,
  hasTiebreaker,
}: {
  lockAt: number;
  games: Game[];
  settings: Settings;
  pickedGameIds: Set<string>;
  hasTiebreaker: boolean;
}) {
  const inWindow = (ms: number) => ms >= lockAt && ms < lockAt + SAME_DAY_MS;
  const unpicked = games.filter(
    (g) =>
      g.status !== "final" &&
      !pickedGameIds.has(g.id) &&
      inWindow(pickDeadlineMs(settings.pickDeadline, g, games))
  ).length;
  const tiebreaker =
    settings.tiebreakerEnabled &&
    !hasTiebreaker &&
    games.length > 0 &&
    inWindow(tiebreakerDeadlineMs(settings.tiebreakerDeadline, games));
  return { unpicked, tiebreaker, any: unpicked > 0 || tiebreaker };
}
