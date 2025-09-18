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
