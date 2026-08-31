// app/admin/refresh/page.tsx
import { refreshScoresAction, fullSyncAction } from "./actions";
import SubmitButton from "./SubmitButton";

export const revalidate = 0;

export default function AdminRefreshPage() {
  return (
    <main className="mx-auto max-w-xl p-6 space-y-8">
      <h1 className="text-xl font-semibold">Admin: NFL Schedule &amp; Scores</h1>

      <section className="space-y-3">
        <h2 className="font-medium">Refresh Scores</h2>
        <form action={refreshScoresAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-text-muted">Season Label</span>
              <input
                name="seasonLabel"
                defaultValue="2025-2026"
                className="border rounded-lg px-3 py-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-text-muted">Season Year</span>
              <input
                name="seasonYear"
                type="number"
                defaultValue={2025}
                className="border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <label className="flex flex-col">
            <span className="text-sm text-text-muted">
              Limit to Week (optional)
            </span>
            <input
              name="week"
              type="number"
              placeholder="e.g. 4"
              className="border rounded-lg px-3 py-2"
            />
          </label>

          <SubmitButton label="Refresh Scores" pendingLabel="Refreshing…" />
        </form>
        <p className="text-sm text-text-muted">
          Only <code>status</code>, <code>homeScore</code>, and{" "}
          <code>awayScore</code> are updated for games already in the
          database. Missing rows are ignored.
        </p>
      </section>

      <section className="space-y-3 border-t pt-6">
        <h2 className="font-medium">Full Sync (add new games)</h2>
        <form action={fullSyncAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-text-muted">Season Year</span>
              <input
                name="seasonYear"
                type="number"
                defaultValue={2025}
                className="border rounded-lg px-3 py-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-text-muted">Week</span>
              <input
                name="week"
                type="number"
                placeholder="e.g. 4"
                className="border rounded-lg px-3 py-2"
              />
            </label>
          </div>

          <SubmitButton label="Full Sync" pendingLabel="Syncing…" />
        </form>
        <p className="text-sm text-text-muted">
          Fetches the full schedule for the given week from ESPN and inserts
          any games not yet in the database (use this before a new week&apos;s
          games appear via Refresh Scores). Leave week blank to sync the
          whole season.
        </p>
      </section>
    </main>
  );
}
