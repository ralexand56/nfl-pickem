import Card from "@/components/ui/Card";
import { getCurrentNfl } from "@/lib/server";

const WEEK_LABELS: Record<number, string> = {
  19: "Wild Card",
  20: "Divisional",
  21: "Conference",
  22: "Super Bowl",
};

export default async function Home() {
  const { season: currentSeason } = await getCurrentNfl();
  const season = currentSeason ?? new Date().getFullYear();

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4 text-text">Alexander NFL Pick&apos;em</h1>
      <p className="text-text-muted mb-4">Choose a week to make your picks.</p>

      <div className="grid gap-2">
        {/* Regular Season Weeks */}
        <h2 className="text-xl font-semibold mt-4 mb-2 text-text">Regular Season</h2>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
          <a key={week} href={`/week/${season}/${week}`}>
            <Card className="p-4 hover:bg-surface-muted transition-colors">
              Week {week}
            </Card>
          </a>
        ))}

        {/* Playoff Weeks */}
        <h2 className="text-xl font-semibold mt-6 mb-2 text-text">Playoffs</h2>
        {[19, 20, 21].map((week) => (
          <a key={week} href={`/week/${season}/${week}`}>
            <Card className="p-4 hover:bg-surface-muted transition-colors">
              Week {week} - {WEEK_LABELS[week]}
            </Card>
          </a>
        ))}
        {/* Add Super Bowl (week 22) once it's on the schedule */}
      </div>
    </main>
  );
}
