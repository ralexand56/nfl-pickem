import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import { getViewerId } from "@/lib/group";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { joinGroupAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [group] = await db
    .select({ id: groups.id, slug: groups.slug, name: groups.name })
    .from(groups)
    .where(eq(groups.inviteToken, token));

  if (!group) {
    return (
      <main className="max-w-md mx-auto p-6">
        <Card>
          <h1 className="text-xl font-semibold text-text mb-2">Invite link expired</h1>
          <p className="text-text-muted">
            This invite link isn&apos;t valid anymore. Ask your group&apos;s admin
            for a new one.
          </p>
        </Card>
      </main>
    );
  }

  const viewerId = await getViewerId();
  if (!viewerId) redirect(`/signin?callbackUrl=/join/${token}`);

  const [already] = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, viewerId))
    );
  if (already) redirect(`/g/${group.slug}`);

  const [{ members }] = await db
    .select({ members: count() })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, group.id));

  return (
    <main className="max-w-md mx-auto p-6">
      <Card className="p-6 text-center">
        <p className="text-sm text-text-muted mb-1">You&apos;re invited to</p>
        <h1 className="text-2xl font-bold text-text mb-1">{group.name}</h1>
        <p className="text-sm text-text-muted mb-6">
          {members} {members === 1 ? "member" : "members"} · NFL pick&apos;em
        </p>
        <form action={joinGroupAction.bind(null, token)}>
          <Button variant="primary" className="w-full py-3" type="submit">
            Join group
          </Button>
        </form>
      </Card>
    </main>
  );
}
