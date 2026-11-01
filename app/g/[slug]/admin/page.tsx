import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { groupMembers, groupSeasons, users } from "@/db/schema";
import { requireGroupAdmin } from "@/lib/group";
import { getCurrentNfl } from "@/lib/server";
import Card from "@/components/ui/Card";
import AdminPanel from "./admin-panel";

export const dynamic = "force-dynamic";

export default async function GroupAdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const ctx = await requireGroupAdmin(slug).catch(() => notFound());

  const [members, seasons, current] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        role: groupMembers.role,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, ctx.group.id))
      .orderBy(asc(users.name)),
    db
      .select({ season: groupSeasons.season, status: groupSeasons.status })
      .from(groupSeasons)
      .where(eq(groupSeasons.groupId, ctx.group.id))
      .orderBy(desc(groupSeasons.season)),
    getCurrentNfl(),
  ]);

  const currentSeason = current.season ?? new Date().getFullYear();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-text">{ctx.group.name} · Admin</h1>

      {welcome && (
        <Card className="bg-success-muted border-transparent">
          <h2 className="font-semibold text-text mb-1">You&apos;re all set! 🏈</h2>
          <p className="text-sm text-text">
            Payment received. Copy the invite link below and share it with your
            group. Everyone who joins plays free this season.
          </p>
        </Card>
      )}

      <AdminPanel
        viewerId={ctx.viewer.id}
        name={ctx.group.name}
        settings={ctx.settings}
        inviteToken={ctx.group.inviteToken}
        members={members}
        seasons={seasons}
        currentSeason={currentSeason}
        compedForever={ctx.group.compedForever}
      />

      {ctx.settings.squaresEnabled && (
        <Card>
          <h2 className="font-semibold text-text mb-1">Super Bowl squares boards</h2>
          <p className="text-sm text-text-muted mb-3">
            Create boards, set teams and price, draw numbers, and lock the board.
          </p>
          <Link
            href={`/g/${slug}/admin/squares`}
            className="text-brand-600 hover:underline text-sm"
          >
            Manage squares boards →
          </Link>
        </Card>
      )}
    </main>
  );
}
