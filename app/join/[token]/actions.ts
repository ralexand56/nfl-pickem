"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import { getViewerId } from "@/lib/group";

export async function joinGroupAction(token: string): Promise<void> {
  const viewerId = await getViewerId();
  if (!viewerId) redirect(`/signin?callbackUrl=/join/${token}`);

  const [group] = await db
    .select({ id: groups.id, slug: groups.slug })
    .from(groups)
    .where(eq(groups.inviteToken, token));
  if (!group) throw new Error("This invite link is no longer valid.");

  await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId: viewerId, role: "member" })
    .onConflictDoNothing();

  redirect(`/g/${group.slug}`);
}
