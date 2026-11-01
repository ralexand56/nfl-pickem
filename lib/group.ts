// The only way pages and API routes should reach per-group data: resolve the
// group from its slug and the viewer's membership in it, from the DB (never
// trusted from the client).
import "server-only";
import { randomBytes } from "crypto";
import { cache } from "react";
import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { and, asc, eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import {
  groupMembers,
  groupSeasons,
  groups,
  users,
  type GroupRole,
  type SelectGroup,
} from "@/db/schema";
import { parseGroupSettings, type GroupSettings } from "@/lib/group-settings";

export type GroupViewer = { id: string; isAdmin: boolean };

export type GroupContext = {
  group: SelectGroup;
  role: GroupRole;
  viewer: GroupViewer;
  settings: GroupSettings;
};

export class GroupAccessError extends Error {
  constructor(
    message: string,
    public status: 401 | 403 | 404
  ) {
    super(message);
  }
}

export const getViewerId = cache(async (): Promise<string | null> => {
  const session = await getServerSession(authOptions as AuthOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
});

// null when signed out, the group doesn't exist, or the viewer isn't a member.
// Cached per request so a layout and its page share one lookup.
export const getGroupContext = cache(
  async (slug: string): Promise<GroupContext | null> => {
    const viewerId = await getViewerId();
    if (!viewerId) return null;
    const [row] = await db
      .select({ group: groups, role: groupMembers.role })
      .from(groups)
      .innerJoin(
        groupMembers,
        and(
          eq(groupMembers.groupId, groups.id),
          eq(groupMembers.userId, viewerId)
        )
      )
      .where(eq(groups.slug, slug));
    if (!row) return null;
    return {
      group: row.group,
      role: row.role,
      viewer: { id: viewerId, isAdmin: row.role === "admin" },
      settings: parseGroupSettings(row.group.settings),
    };
  }
);

// For API routes and server actions: throws GroupAccessError instead of
// returning null, so callers can map it to a status code.
export async function requireGroupMember(slug: unknown): Promise<GroupContext> {
  if (typeof slug !== "string" || !slug) {
    throw new GroupAccessError("Missing group", 404);
  }
  if (!(await getViewerId())) {
    throw new GroupAccessError(
      "You've been signed out. Please sign in again.",
      401
    );
  }
  const ctx = await getGroupContext(slug);
  if (!ctx) throw new GroupAccessError("Group not found", 404);
  return ctx;
}

export async function requireGroupAdmin(slug: unknown): Promise<GroupContext> {
  const ctx = await requireGroupMember(slug);
  if (!ctx.viewer.isAdmin) {
    throw new GroupAccessError("Only group admins can do that.", 403);
  }
  return ctx;
}

export async function isSeasonActive(groupId: string, season: number) {
  const [g] = await db
    .select({ compedForever: groups.compedForever })
    .from(groups)
    .where(eq(groups.id, groupId));
  if (g?.compedForever) return true;
  const [row] = await db
    .select({ season: groupSeasons.season })
    .from(groupSeasons)
    .where(
      and(eq(groupSeasons.groupId, groupId), eq(groupSeasons.season, season))
    );
  return !!row;
}

// Every group the user belongs to, for the nav switcher and home redirect.
export async function getUserGroups(userId: string) {
  const rows = await db
    .select({
      slug: groups.slug,
      name: groups.name,
      role: groupMembers.role,
      settings: groups.settings,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId))
    .orderBy(asc(groups.name));
  return rows.map(({ settings, ...g }) => ({
    ...g,
    squaresEnabled: parseGroupSettings(settings).squaresEnabled,
  }));
}

// Unguessable token for /join/[token] links.
export function newInviteToken() {
  return randomBytes(18).toString("base64url");
}

// Records that the user agreed to the Terms and confirmed their age.
export async function recordTermsAccepted(userId: string) {
  await db
    .update(users)
    .set({ termsAcceptedAt: new Date() })
    .where(eq(users.id, userId));
}
