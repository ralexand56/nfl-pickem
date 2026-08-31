// app/admin/refresh/actions.ts
"use server";

import { revalidateTag } from "next/cache";
import { syncScoresMinimal } from "@/lib/server/syncScoresMinimal";
import { syncScores } from "@/lib/server/scoresSync";

export async function refreshScoresAction(formData: FormData): Promise<void> {
  const seasonYear = Number(formData.get("seasonYear") ?? 2026);
  const weekRaw = formData.get("week");
  const week = weekRaw ? Number(weekRaw) : undefined;

  await syncScoresMinimal({
    seasonYear,
    week,
    force: true,
  });

  try {
    if (week) revalidateTag(`scores-week-${week}`);
    else revalidateTag("scores");
  } catch {}

  // Don't return a value; keep it Promise<void>
  // Optionally: redirect('/admin/refresh?ok=1') after success
}

// Inserts games that don't exist in the DB yet (e.g. a new week's schedule)
// in addition to updating scores/status - syncScoresMinimal above only
// updates rows that already exist, so this is needed to bootstrap a week.
export async function fullSyncAction(formData: FormData): Promise<void> {
  const seasonYear = Number(formData.get("seasonYear") ?? 2026);
  const weekRaw = formData.get("week");
  const week = weekRaw ? Number(weekRaw) : undefined;

  await syncScores({
    seasonYear,
    week,
    force: true,
    onlyTouchMeaningful: false,
  });

  try {
    if (week) revalidateTag(`scores-week-${week}`);
    else revalidateTag("scores");
  } catch {}
}
