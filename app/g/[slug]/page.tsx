import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import WeekStatusBadge from "@/components/WeekStatusBadge";
import { getCurrentNfl } from "@/lib/server";
import { WEEK_LABELS, getWeekStatus } from "@/lib/weeks";
import { getGroupContext } from "@/lib/group";
import { notFound } from "next/navigation";

export default async function GroupHome({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getGroupContext(slug);
  if (!ctx) notFound();
  const base = `/g/${slug}`;
  const current = await getCurrentNfl();
  const season = current.season ?? new Date().getFullYear();

  const renderWeek = (week: number, label: string) => {
    const status = getWeekStatus(season, week, current);
    return (
      <a key={week} href={`${base}/week/${season}/${week}`}>
        <Card
          className={clsx(
            "p-4 hover:bg-surface-muted transition-colors flex items-center justify-between gap-3",
            status === "current" && "border-brand-500 ring-1 ring-brand-500",
            status === "past" && "text-text-muted"
          )}
        >
          <span>{label}</span>
          <WeekStatusBadge status={status} />
        </Card>
      </a>
    );
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-text">{ctx.group.name}</h1>
      <p className="text-text-muted mb-4">
        Choose a week to make your picks.
        {current.week != null && current.season === season && (
          <>
            {" "}
            <a
              href={`${base}/week/${season}/${current.week}`}
              className="text-brand-600 hover:underline"
            >
              Jump to this week →
            </a>
          </>
        )}
      </p>

      <div className="grid gap-2">
        {/* Regular Season Weeks */}
        <h2 className="text-xl font-semibold mt-4 mb-2 text-text">Regular Season</h2>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((week) =>
          renderWeek(week, `Week ${week}`)
        )}

        {/* Playoff Weeks */}
        {ctx.settings.includePlayoffs && (
          <>
            <h2 className="text-xl font-semibold mt-6 mb-2 text-text">Playoffs</h2>
            {[19, 20, 21].map((week) =>
              renderWeek(week, `Week ${week} - ${WEEK_LABELS[week]}`)
            )}
          </>
        )}
        {/* Add Super Bowl (week 22) once it's on the schedule */}
      </div>
    </main>
  );
}
