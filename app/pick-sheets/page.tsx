import type { Metadata } from "next";
import Link from "next/link";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import WeekStatusBadge from "@/components/WeekStatusBadge";
import { getSeasonWeeks } from "@/lib/pick-sheets";
import { getCurrentNfl } from "@/lib/server";
import { getWeekLabel, getWeekStatus } from "@/lib/weeks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free Printable NFL Pick Sheets, Every Week",
  description:
    "Free printable NFL pick'em sheets for every week of the season, with kickoff times and a tiebreaker. Or run your pick'em online for family and friends.",
  alternates: { canonical: "/pick-sheets" },
};

export default async function PickSheetsIndex() {
  const current = await getCurrentNfl();
  const season = current.season ?? new Date().getFullYear();
  const weeks = await getSeasonWeeks(season);

  return (
    <div className="bg-bg">
      <section className="bg-brand-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400 mb-2">
            {season} season
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
            Free printable NFL pick sheets
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            One sheet per week with every game, kickoff times and a tiebreaker
            line. Print as many as your pool needs.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {weeks.map((w) => {
            const status = getWeekStatus(season, w, current);
            return (
              <Link key={w} href={`/pick-sheets/${season}/${w}`}>
                <Card
                  className={clsx(
                    "flex h-full flex-col gap-2 hover:bg-surface-muted transition-colors",
                    status === "current" && "ring-2 ring-accent-500 border-accent-500",
                    status === "past" && "opacity-70"
                  )}
                >
                  <span className="font-semibold text-text">{getWeekLabel(w)}</span>
                  <WeekStatusBadge status={status} className="self-start" />
                </Card>
              </Link>
            );
          })}
        </div>

        <Card className="bg-brand-900 border-transparent text-white p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Skip the paper this week</h2>
          <p className="text-white/85 max-w-xl mx-auto mb-6">
            Everyone picks from their phone, picks lock at kickoff, and the
            leaderboard updates itself. $10 for the whole group, members play free.
          </p>
          <Link
            href="/start"
            className="inline-block rounded-control bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
          >
            Start your group · $10
          </Link>
        </Card>
      </div>
    </div>
  );
}
