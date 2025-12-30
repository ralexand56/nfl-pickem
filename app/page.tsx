export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Alexander NFL Pick’em</h1>
      <p className="text-gray-600 mb-4">Choose a week to make your picks.</p>
      <div className="grid gap-2">
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
      </div>
    </main>
  );
}
