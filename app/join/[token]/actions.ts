"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import { getViewerId, recordTermsAccepted } from "@/lib/group";

export async function joinGroupAction(
  token: string,
  formData: FormData
): Promise<void> {
  const viewerId = await getViewerId();
  if (!viewerId) redirect(`/signin?callbackUrl=/join/${token}`);
  // The checkbox is required in the form; enforce it here too.
  if (formData.get("agree") !== "on") redirect(`/join/${token}?agree=required`);

  const [group] = await db
    .select({ id: groups.id, slug: groups.slug })
    .from(groups)
    .where(eq(groups.inviteToken, token));
  if (!group) throw new Error("This invite link is no longer valid.");

  await recordTermsAccepted(viewerId);
  await db
    .insert(groupMembers)
    .values({ groupId: group.id, userId: viewerId, role: "member" })
    .onConflictDoNothing();

  redirect(`/g/${group.slug}`);
}
