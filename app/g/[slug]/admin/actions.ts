"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups, type GroupRole } from "@/db/schema";
import { newInviteToken, requireGroupAdmin } from "@/lib/group";
import { getStripe } from "@/lib/stripe";
import { groupSettingsSchema, type GroupSettings } from "@/lib/group-settings";

function revalidateGroup(slug: string) {
  // The layout reads settings, so refresh everything under the group.
  revalidatePath(`/g/${slug}`, "layout");
}

export async function saveSettingsAction(
  slug: string,
  name: string,
  settings: GroupSettings
): Promise<void> {
  const { group } = await requireGroupAdmin(slug);
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60) {
    throw new Error("Group name must be 1–60 characters");
  }
  const parsed = groupSettingsSchema.safeParse(settings);
  if (!parsed.success) throw new Error("Some settings aren't valid");
  await db
    .update(groups)
    .set({ name: trimmed, settings: parsed.data })
    .where(eq(groups.id, group.id));
  revalidateGroup(slug);
}

export async function resetInviteAction(slug: string): Promise<string> {
  const { group } = await requireGroupAdmin(slug);
  const token = newInviteToken();
  await db
    .update(groups)
    .set({ inviteToken: token })
    .where(eq(groups.id, group.id));
  revalidatePath(`/g/${slug}/admin`);
  return token;
}

async function adminCount(groupId: string) {
  const [{ n }] = await db
    .select({ n: count() })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.role, "admin"))
    );
  return n;
}

async function memberRole(groupId: string, userId: string) {
  const [m] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
  return m?.role ?? null;
}

export async function setRoleAction(
  slug: string,
  userId: string,
  role: GroupRole
): Promise<void> {
  const { group } = await requireGroupAdmin(slug);
  if (role !== "admin" && role !== "member") throw new Error("Invalid role");
  const current = await memberRole(group.id, userId);
  if (!current) throw new Error("Not a member of this group");
  if (current === "admin" && role === "member" && (await adminCount(group.id)) <= 1) {
    throw new Error("A group needs at least one admin");
  }
  await db
    .update(groupMembers)
    .set({ role })
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId))
    );
  revalidateGroup(slug);
}

// Their past picks and payments stay in the DB (and come back if they're
// re-invited); they just stop seeing and appearing in the group.
export async function removeMemberAction(
  slug: string,
  userId: string
): Promise<void> {
  const { group } = await requireGroupAdmin(slug);
  const current = await memberRole(group.id, userId);
  if (!current) return;
  if (current === "admin" && (await adminCount(group.id)) <= 1) {
    throw new Error("A group needs at least one admin");
  }
  await db
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId))
    );
  revalidateGroup(slug);
}

// Turns automatic renewal off (or back on before it lapses). The current
// season stays paid either way; Stripe just won't charge the next one.
export async function setAutoRenewAction(slug: string, on: boolean): Promise<void> {
  const { group } = await requireGroupAdmin(slug);
  if (!group.stripeSubscriptionId) {
    throw new Error(
      on
        ? "To turn automatic renewal on, renew with the box checked."
        : "Automatic renewal is already off."
    );
  }
  await getStripe().subscriptions.update(group.stripeSubscriptionId, {
    cancel_at_period_end: !on,
  });
  await db.update(groups).set({ autoRenew: on }).where(eq(groups.id, group.id));
  revalidatePath(`/g/${slug}/admin`);
}
