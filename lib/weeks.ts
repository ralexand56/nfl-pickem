// Week labels and past/current/upcoming classification. Pure and client-safe
// so both server pages and client components can use it.

export const WEEK_LABELS: Record<number, string> = {
  19: "Wild Card",
  20: "Divisional",
  21: "Conference",
  22: "Super Bowl",
};

export const getWeekLabel = (wk: number) => WEEK_LABELS[wk] || `Week ${wk}`;

export type WeekStatus = "past" | "current" | "upcoming";

// `current` comes from getCurrentNfl(). When ESPN didn't give us a current
// week (API down, off-season) we can't classify, so return null.
export function getWeekStatus(
  season: number,
  week: number,
  current: { season: number | null; week: number | null }
): WeekStatus | null {
  if (current.season == null || current.week == null) return null;
  if (season !== current.season) {
    return season < current.season ? "past" : "upcoming";
  }
  if (week === current.week) return "current";
  return week < current.week ? "past" : "upcoming";
}
