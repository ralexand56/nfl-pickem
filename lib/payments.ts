import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, users, weeklyPayments } from "@/db/schema";
import type { GroupViewer } from "@/lib/group";

// The signed-in group member; isAdmin comes from their group role.
export type PaymentViewer = GroupViewer | null;

export type PaymentPlayer = {
  id: string;
  name: string;
  image: string | null;
  paid: boolean;
  method: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
};

// Every member of the group, with their paid status for the given week.
export async function getWeekPayments(
  groupId: string,
  season: number,
  week: number
): Promise<PaymentPlayer[]> {
  const [allUsers, rows] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, image: users.image })
      .from(users)
      .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, groupId)),
    db
      .select()
      .from(weeklyPayments)
      .where(
        and(
          eq(weeklyPayments.groupId, groupId),
          eq(weeklyPayments.season, season),
          eq(weeklyPayments.week, week)
        )
      ),
  ]);

  const nameById = new Map(allUsers.map((u) => [u.id, u.name ?? "Unknown"]));
  const rowByUser = new Map(rows.map((r) => [r.userId, r]));

  return allUsers
    .map((u) => {
      const r = rowByUser.get(u.id);
      return {
        id: u.id,
        name: u.name ?? "Unknown",
        image: u.image,
        paid: r?.paid ?? false,
        method: r?.method ?? null,
        updatedByName: r?.updatedBy ? nameById.get(r.updatedBy) ?? null : null,
        updatedAt: r?.updatedAt ? r.updatedAt.toISOString() : null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
