import { db } from "@/db";
import { superBowlSquaresConfig } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireGroupAdmin } from "@/lib/group";
import GameAdmin from "./game-admin";

export const dynamic = "force-dynamic";

async function getGameConfig(groupId: string, gameId: string) {
  const config = await db
    .select()
    .from(superBowlSquaresConfig)
    .where(
      and(
        eq(superBowlSquaresConfig.groupId, groupId),
        eq(superBowlSquaresConfig.gameId, gameId)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  return config;
}

export default async function GameAdminPage({
  params,
}: {
  params: Promise<{ slug: string; gameId: string }>;
}) {
  const { slug, gameId } = await params;
  const { group } = await requireGroupAdmin(slug).catch(() => notFound());
  const config = await getGameConfig(group.id, gameId);

  if (!config) {
    notFound();
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Manage Game: {config.awayTeam} @ {config.homeTeam}
        </h1>
        <p className="text-text-muted">Game ID: {config.gameId}</p>
      </div>

      <GameAdmin config={config} gameId={gameId} />
    </div>
  );
}
