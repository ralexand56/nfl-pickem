import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, weeklyPayments } from "@/db/schema";
import { requireGroupMember, type GroupContext } from "@/lib/group";
import { groupErrorResponse } from "@/lib/api";
import { MAX_METHOD_LENGTH } from "@/lib/payment-methods";

export async function POST(req: Request) {
  // paid and method are each optional so either can be changed on its own
  const {
    group: slug,
    userId,
    season,
    week,
    paid,
    method: rawMethod,
  } = await req.json();

  let ctx: GroupContext;
  try {
    ctx = await requireGroupMember(slug);
  } catch (error) {
    return groupErrorResponse(error);
  }
  const viewerId = ctx.viewer.id;
  if (!ctx.settings.buyInEnabled) {
    return NextResponse.json(
      { error: "This group doesn't track buy-ins." },
      { status: 403 }
    );
  }

  const method =
    typeof rawMethod === "string" ? rawMethod.trim().slice(0, MAX_METHOD_LENGTH) || null : rawMethod;
  if (
    typeof userId !== "string" ||
    !Number.isInteger(season) ||
    !Number.isInteger(week) ||
    (paid !== undefined && typeof paid !== "boolean") ||
    (method !== undefined && method !== null && typeof method !== "string") ||
    (paid === undefined && method === undefined)
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (userId !== viewerId) {
    if (!ctx.viewer.isAdmin) {
      return NextResponse.json(
        { error: "You can only change your own payment status." },
        { status: 403 }
      );
    }
    // Admins can only mark members of their own group.
    const [member] = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, ctx.group.id),
          eq(groupMembers.userId, userId)
        )
      );
    if (!member) {
      return NextResponse.json({ error: "Not a group member" }, { status: 404 });
    }
  }

  try {
    const changes = {
      ...(paid !== undefined && { paid }),
      ...(method !== undefined && { method }),
      updatedBy: viewerId,
      updatedAt: new Date(),
    };
    await db
      .insert(weeklyPayments)
      .values({ groupId: ctx.group.id, userId, season, week, ...changes })
      .onConflictDoUpdate({
        target: [
          weeklyPayments.groupId,
          weeklyPayments.userId,
          weeklyPayments.season,
          weeklyPayments.week,
        ],
        set: changes,
      });
  } catch (error) {
    console.error("Failed to save payment:", error);
    return NextResponse.json(
      { error: "Failed to save payment status" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
