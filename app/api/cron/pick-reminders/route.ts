import { NextResponse } from "next/server";
import { and, eq, gte, inArray, lte, or } from "drizzle-orm";
import { db } from "@/db";
import {
  autoPickReminders,
  games,
  groupMembers,
  groups,
  pickReminders,
  picks,
  users,
  weeklyTiebreakers,
} from "@/db/schema";
import { isSeasonActive } from "@/lib/group";
import { parseGroupSettings } from "@/lib/group-settings";
import {
  RECENT_MANUAL_MS,
  dueAtLock,
  isReminderDue,
  reminderLocks,
} from "@/lib/auto-reminders";
import { getPickStatus, pickStatusSummary } from "@/lib/pick-status";
import { kickoffLabel } from "@/lib/pick-sheets";
import { getWeekLabel } from "@/lib/weeks";
import { sendPickReminder } from "@/lib/email";
import { reminderOneClickUrl, reminderStopUrl } from "@/lib/reminder-links";

// Called about every 15 minutes on game days by a GitHub Actions schedule
// (.github/workflows/pick-reminders.yml), which sends
// "Authorization: Bearer $PICK_REMINDER_SECRET". Emails members who started
// a week's picks but still have something that locks within about an hour.
export async function GET(req: Request) {
  const secret = process.env.PICK_REMINDER_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  // Weeks with a kickoff in the next two hours are the only ones that can
  // have a lock in the reminder window.
  const soon = await db
    .selectDistinct({ season: games.season, week: games.week })
    .from(games)
    .where(and(gte(games.date, new Date(now)), lte(games.date, new Date(now + 2 * 60 * 60 * 1000))));
  if (soon.length === 0) return NextResponse.json({ sent: 0, weeks: 0 });

  const weekGames = await db
    .select()
    .from(games)
    .where(or(...soon.map((w) => and(eq(games.season, w.season), eq(games.week, w.week)))));
  const allGroups = await db.select({ id: groups.id, slug: groups.slug, name: groups.name, settings: groups.settings }).from(groups);

  let sent = 0;
  let failed = 0;
  for (const group of allGroups) {
    const settings = parseGroupSettings(group.settings);
    if (!settings.autoRemindersEnabled) continue;

    for (const { season, week } of soon) {
      const gs = weekGames.filter((g) => g.season === season && g.week === week);
      const dueLocks = reminderLocks(gs, settings).filter((l) => isReminderDue(l, now));
      if (dueLocks.length === 0) continue;
      if (!(await isSeasonActive(group.id, season))) continue;

      const [members, weekPicks, tiebreakers, recentManual] = await Promise.all([
        db
          .select({ id: users.id, email: users.email })
          .from(groupMembers)
          .innerJoin(users, eq(users.id, groupMembers.userId))
          .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.autoRemindersOff, false))),
        db
          .select({ userId: picks.userId, gameId: picks.gameId })
          .from(picks)
          .where(and(eq(picks.groupId, group.id), inArray(picks.gameId, gs.map((g) => g.id)))),
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
          .select({ userId: pickReminders.userId })
          .from(pickReminders)
          .where(
            and(
              eq(pickReminders.groupId, group.id),
              eq(pickReminders.season, season),
              eq(pickReminders.week, week),
              gte(pickReminders.sentAt, new Date(now - RECENT_MANUAL_MS))
            )
          ),
      ]);
      const skipRecent = new Set(recentManual.map((r) => r.userId));

      for (const lockAt of dueLocks) {
        for (const m of members) {
          if (!m.email || skipRecent.has(m.id)) continue;
          const pickedGameIds = new Set(
            weekPicks.filter((p) => p.userId === m.id).map((p) => p.gameId)
          );
          const hasTiebreaker = tiebreakers.some((t) => t.userId === m.id);
          // Only people who've started this week.
          if (pickedGameIds.size === 0 && !hasTiebreaker) continue;
          if (!dueAtLock({ lockAt, games: gs, settings, pickedGameIds, hasTiebreaker }).any) continue;

          // Claim first so overlapping runs can't double-send.
          const claimed = await db
            .insert(autoPickReminders)
            .values({ groupId: group.id, userId: m.id, lockAt: new Date(lockAt) })
            .onConflictDoNothing()
            .returning({ userId: autoPickReminders.userId });
          if (claimed.length === 0) continue;

          const status = getPickStatus({ games: gs, pickedGameIds, hasTiebreaker, settings, nowMs: now });
          const deadline = kickoffLabel(new Date(lockAt));
          try {
            await sendPickReminder({
              to: m.email,
              groupName: group.name,
              weekLabel: getWeekLabel(week),
              summary: pickStatusSummary(status),
              deadline: `${deadline.day}, ${deadline.time}`,
              path: `/g/${group.slug}/week/${season}/${week}`,
              automatic: {
                stopUrl: reminderStopUrl(group.id, m.id),
                oneClickUrl: reminderOneClickUrl(group.id, m.id),
              },
            });
            sent++;
            // Shows as "reminded recently" in the admin's Remind panel.
            const sentAt = new Date();
            await db
              .insert(pickReminders)
              .values({ groupId: group.id, userId: m.id, season, week, sentAt })
              .onConflictDoUpdate({
                target: [pickReminders.groupId, pickReminders.userId, pickReminders.season, pickReminders.week],
                set: { sentAt },
              });
          } catch (error) {
            failed++;
            console.error("Automatic pick reminder failed:", m.id, error);
            // Release the claim so the next run can retry.
            await db
              .delete(autoPickReminders)
              .where(
                and(
                  eq(autoPickReminders.groupId, group.id),
                  eq(autoPickReminders.userId, m.id),
                  eq(autoPickReminders.lockAt, new Date(lockAt))
                )
              );
          }
        }
      }
    }
  }
  return NextResponse.json({ sent, failed, weeks: soon.length });
}
