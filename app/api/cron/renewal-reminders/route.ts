import { NextResponse } from "next/server";
import { and, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups, users } from "@/db/schema";
import { sendRenewalReminder } from "@/lib/email";

const DAY = 24 * 60 * 60 * 1000;

// Daily (vercel.json crons). Emails each auto-renewing group's admins once,
// 15–45 days before the renewal charge, as California's auto-renewal law
// requires for yearly plans. Vercel sends "Authorization: Bearer
// $CRON_SECRET" with cron requests.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const due = await db
    .select({
      id: groups.id,
      slug: groups.slug,
      name: groups.name,
      renewsAt: groups.renewsAt,
    })
    .from(groups)
    .where(
      and(
        eq(groups.autoRenew, true),
        // Send at ~30 days; the 15-day floor still catches anything missed.
        lte(groups.renewsAt, new Date(now + 30 * DAY)),
        gte(groups.renewsAt, new Date(now + 15 * DAY))
      )
    );

  let sent = 0;
  for (const g of due) {
    const season = g.renewsAt!.getUTCFullYear();
    // Claim the reminder first so overlapping runs can't double-send.
    const claimed = await db
      .update(groups)
      .set({ renewalReminderSeason: season })
      .where(
        and(
          eq(groups.id, g.id),
          or(isNull(groups.renewalReminderSeason), ne(groups.renewalReminderSeason, season))
        )
      )
      .returning({ id: groups.id });
    if (claimed.length === 0) continue;

    const admins = await db
      .select({ email: users.email })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(and(eq(groupMembers.groupId, g.id), eq(groupMembers.role, "admin")));
    for (const a of admins) {
      if (!a.email) continue;
      try {
        await sendRenewalReminder({
          to: a.email,
          groupName: g.name,
          groupSlug: g.slug,
          renewsAt: g.renewsAt!,
        });
        sent++;
      } catch (e) {
        console.error(`Renewal reminder to ${a.email} failed`, e);
      }
    }
  }

  return NextResponse.json({ groups: due.length, sent });
}
