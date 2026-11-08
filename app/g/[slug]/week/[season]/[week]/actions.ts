"use server";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { games, groupMembers, picks, pickReminders, users, weeklyTiebreakers } from "@/db/schema";
import { isSeasonActive, requireGroupAdmin } from "@/lib/group";
import { sendPickReminder } from "@/lib/email";
import { pickDeadlineMs, tiebreakerDeadlineMs } from "@/lib/group-settings";
import { kickoffLabel } from "@/lib/pick-sheets";
import { getPickStatus, pickStatusSummary } from "@/lib/pick-status";
import { getWeekLabel } from "@/lib/weeks";
import { REMINDER_COOLDOWN_MS } from "./reminder-rules";

const SEND_BATCH = 5;

// Emails the chosen members about a week's picks. Everything is re-checked
// here: only current members who still have something they can finish, and
// nobody reminded within the cooldown.
export async function sendPickRemindersAction(
  slug: string,
  season: number,
  week: number,
  userIds: string[]
): Promise<{ sent: number; skipped: number; failed: number }> {
  const { group, settings } = await requireGroupAdmin(slug);
  if (!(await isSeasonActive(group.id, season))) {
    throw new Error(`This group isn't active for the ${season} season.`);
  }
  const wanted = Array.from(new Set(userIds));
  if (wanted.length === 0) return { sent: 0, skipped: 0, failed: 0 };

  const weekGames = await db
    .select()
    .from(games)
    .where(and(eq(games.season, season), eq(games.week, week)));
  if (weekGames.length === 0) throw new Error("Unknown week");

  const [members, weekPicks, tiebreakers, recent] = await Promise.all([
    db
      .select({ id: users.id, email: users.email })
      .from(users)
      .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
      .where(and(eq(groupMembers.groupId, group.id), inArray(users.id, wanted))),
    db
      .select({ userId: picks.userId, gameId: picks.gameId })
      .from(picks)
      .where(
        and(
          eq(picks.groupId, group.id),
          inArray(picks.gameId, weekGames.map((g) => g.id))
        )
      ),
    db
      .select({ userId: weeklyTiebreakers.userId })
      .from(weeklyTiebreakers)
      .where(
        and(
          eq(weeklyTiebreakers.groupId, group.id),
          eq(weeklyTiebreakers.season, season),
          eq(weeklyTiebreakers.week, week)
        )
      ),
    db
      .select({ userId: pickReminders.userId, sentAt: pickReminders.sentAt })
      .from(pickReminders)
      .where(
        and(
          eq(pickReminders.groupId, group.id),
          eq(pickReminders.season, season),
          eq(pickReminders.week, week)
        )
      ),
  ]);

  const now = Date.now();
  const remindedRecently = new Set(
    recent
      .filter((r) => now - r.sentAt.getTime() < REMINDER_COOLDOWN_MS)
      .map((r) => r.userId)
  );

  const queue = members.flatMap((m) => {
    if (!m.email || remindedRecently.has(m.id)) return [];
    const status = getPickStatus({
      games: weekGames,
      pickedGameIds: new Set(
        weekPicks.filter((p) => p.userId === m.id).map((p) => p.gameId)
      ),
      hasTiebreaker: tiebreakers.some((t) => t.userId === m.id),
      settings,
      nowMs: now,
    });
    if (status.complete || !status.canStillFinish) return [];
    const nextGame = weekGames.find((g) => g.id === status.firstOpenGameId);
    const deadlineMs = nextGame
      ? pickDeadlineMs(settings.pickDeadline, nextGame, weekGames)
      : tiebreakerDeadlineMs(settings.tiebreakerDeadline, weekGames);
    const deadline = kickoffLabel(new Date(deadlineMs));
    return [
      {
        id: m.id,
        email: m.email,
        summary: pickStatusSummary(status),
        deadline: `${deadline.day}, ${deadline.time}`,
      },
    ];
  });

  let sent = 0;
  for (let i = 0; i < queue.length; i += SEND_BATCH) {
    const batch = queue.slice(i, i + SEND_BATCH);
    const results = await Promise.allSettled(
      batch.map((r) =>
        sendPickReminder({
          to: r.email,
          groupName: group.name,
          weekLabel: getWeekLabel(week),
          summary: r.summary,
          deadline: r.deadline,
          path: `/g/${group.slug}/week/${season}/${week}`,
        })
      )
    );
    const delivered = batch.filter((_, n) => results[n].status === "fulfilled");
    for (const [n, result] of results.entries()) {
      if (result.status === "rejected") {
        console.error("Pick reminder failed:", batch[n].id, result.reason);
      }
    }
    if (delivered.length > 0) {
      const sentAt = new Date();
      await db
        .insert(pickReminders)
        .values(
          delivered.map((r) => ({ groupId: group.id, userId: r.id, season, week, sentAt }))
        )
        .onConflictDoUpdate({
          target: [
            pickReminders.groupId,
            pickReminders.userId,
            pickReminders.season,
            pickReminders.week,
          ],
          set: { sentAt },
        });
      sent += delivered.length;
    }
  }

  return {
    sent,
    skipped: wanted.length - queue.length,
    failed: queue.length - sent,
  };
}
