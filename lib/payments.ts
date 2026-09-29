import { getServerSession } from "next-auth";
import type { AuthOptions } from "next-auth";
import { and, eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db";
import { users, weeklyPayments } from "@/db/schema";

// People who can mark any player as paid/unpaid.
export const PAYMENT_ADMIN_EMAILS = [
  "ralexand56@gmail.com",
  "sydmichelle7@gmail.com",
];

export function isPaymentAdmin(email: string | null | undefined) {
  return !!email && PAYMENT_ADMIN_EMAILS.includes(email.toLowerCase());
}

export type PaymentViewer = { id: string; isAdmin: boolean } | null;

// The signed-in user, with admin status looked up from the DB (not trusted
// from the client).
export async function getPaymentViewer(): Promise<PaymentViewer> {
  const session = await getServerSession(authOptions as AuthOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const [u] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, id));
  if (!u) return null;
  return { id, isAdmin: isPaymentAdmin(u.email) };
}

export type PaymentPlayer = {
  id: string;
  name: string;
  image: string | null;
  paid: boolean;
  method: string | null;
  updatedByName: string | null;
  updatedAt: string | null;
};

// Everyone who has signed up, with their paid status for the given week.
export async function getWeekPayments(
  season: number,
  week: number
): Promise<PaymentPlayer[]> {
  const [allUsers, rows] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, image: users.image })
      .from(users),
    db
      .select()
      .from(weeklyPayments)
      .where(
        and(eq(weeklyPayments.season, season), eq(weeklyPayments.week, week))
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
