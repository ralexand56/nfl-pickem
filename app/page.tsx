const WEEK_LABELS: Record<number, string> = {
  19: "Wild Card",
  20: "Divisional",
  21: "Conference",
  22: "Super Bowl",
};

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Alexander NFL Pick&apos;em</h1>
      <p className="text-gray-600 mb-4">Choose a week to make your picks.</p>

      <div className="grid gap-2">
        {/* Regular Season Weeks */}
        <h2 className="text-xl font-semibold mt-4 mb-2">Regular Season</h2>
        {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => {
          const season = week === 18 ? 2026 : 2025; // make this dynamic later
          return (
            <a
              key={week}
              href={`/week/${season}/${week}`}
              className="rounded-xl p-4 border hover:bg-gray-50"
            >
              Week {week}
            </a>
          );
        })}

        {/* Playoff Weeks */}
        <h2 className="text-xl font-semibold mt-6 mb-2">Playoffs</h2>
        {[19].map((week) => {
          const season = 2026;
          return (
            <a
              key={week}
              href={`/week/${season}/${week}`}
              className="rounded-xl p-4 border hover:bg-gray-50"
            >
              Week {week} - {WEEK_LABELS[week]}
            </a>
          );
        })}
        {/* Add more playoff weeks after Wild Card results are known */}
      </div>
    </main>
  );
}
