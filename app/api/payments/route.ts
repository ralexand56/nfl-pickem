import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, weeklyPayments } from "@/db/schema";
import { requireSession } from "@/lib/auth";
import { isPaymentAdmin } from "@/lib/payments";
import { MAX_METHOD_LENGTH } from "@/lib/payment-methods";

export async function POST(req: Request) {
  let viewerId: string;
  try {
    const session = await requireSession();
    viewerId = session.user!.id!;
  } catch {
    return NextResponse.json(
      { error: "You've been signed out. Please sign in again." },
      { status: 401 }
    );
  }

  // paid and method are each optional so either can be changed on its own
  const { userId, season, week, paid, method: rawMethod } = await req.json();
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
    const [viewer] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, viewerId));
    if (!isPaymentAdmin(viewer?.email)) {
      return NextResponse.json(
        { error: "You can only change your own payment status." },
        { status: 403 }
      );
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
      .values({ userId, season, week, ...changes })
      .onConflictDoUpdate({
        target: [weeklyPayments.userId, weeklyPayments.season, weeklyPayments.week],
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
