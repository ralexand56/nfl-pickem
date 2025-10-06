// app/admin/refresh/actions.ts
"use server";

import { revalidateTag } from "next/cache";
import { syncScoresMinimal } from "@/lib/server/syncScoresMinimal";

export async function refreshScoresAction(formData: FormData): Promise<void> {
  const seasonYear = Number(formData.get("seasonYear") ?? 2025);
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
