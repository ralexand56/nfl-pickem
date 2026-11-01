import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getSeasonWeeks } from "@/lib/pick-sheets";
import { getCurrentNfl } from "@/lib/server";

// Re-generated daily so new weeks' pick sheets appear.
export const revalidate = 86400;

// Only public pages; everything under /g/ is private to its group.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const season = (await getCurrentNfl()).season ?? new Date().getFullYear();
  const weeks = await getSeasonWeeks(season).catch(() => []);
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/super-bowl-squares`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/pick-sheets`, changeFrequency: "weekly", priority: 0.8 },
    ...weeks.map((w) => ({
      url: `${SITE_URL}/pick-sheets/${season}/${w}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
