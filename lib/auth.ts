import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session, AuthOptions } from "next-auth";

// Extend the Session type to include 'id' on user
type SessionWithId = Session & {
  user?: Session["user"] & { id?: string };
};

export async function requireSession() {
  const session = (await getServerSession(authOptions as AuthOptions)) as SessionWithId;
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

// Site owners maintain the shared NFL schedule (/admin/games, /admin/refresh).
// Comma-separated in OWNER_EMAILS; unset means nobody is an owner.
export function isOwnerEmail(email: string | null | undefined) {
  const owners = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && owners.includes(email.toLowerCase());
}

export async function requireOwner() {
  const session = await requireSession();
  if (!isOwnerEmail(session.user?.email)) throw new Error("Forbidden");
  return session;
}
