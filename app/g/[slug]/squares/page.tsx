import { notFound, redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { getGroupContext } from "@/lib/group";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

// Sends members to the group's newest squares board.
export default async function SquaresPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getGroupContext(slug);
  if (!ctx || !ctx.settings.squaresEnabled) notFound();

  const [latest] = await db
    .select({ gameId: superBowlSquaresConfig.gameId })
    .from(superBowlSquaresConfig)
    .where(eq(superBowlSquaresConfig.groupId, ctx.group.id))
    .orderBy(desc(superBowlSquaresConfig.createdAt))
    .limit(1);
  if (latest) redirect(`/g/${slug}/squares/${latest.gameId}`);

  return (
    <main className="max-w-2xl mx-auto p-6">
      <Card>
        <h1 className="text-xl font-semibold text-text mb-2">Super Bowl Squares</h1>
        <p className="text-text-muted">
          {ctx.viewer.isAdmin ? (
            <>
              No squares board yet.{" "}
              <a href={`/g/${slug}/admin/squares`} className="text-brand-600 hover:underline">
                Create one
              </a>
              .
            </>
          ) : (
            "Your group admin hasn't set up a squares board yet."
          )}
        </p>
      </Card>
    </main>
  );
}
