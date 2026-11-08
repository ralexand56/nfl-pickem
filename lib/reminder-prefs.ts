import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";

// Returns the group name and the member's current choice, or null if they
// aren't (or are no longer) a member.
export async function getAutoReminderPref(groupId: string, userId: string) {
  const [row] = await db
    .select({ groupName: groups.name, off: groupMembers.autoRemindersOff })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  return row ?? null;
}

export async function setAutoReminders(groupId: string, userId: string, on: boolean) {
  await db
    .update(groupMembers)
    .set({ autoRemindersOff: !on })
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}
