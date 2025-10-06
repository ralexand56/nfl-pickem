// app/admin/refresh/page.tsx
import { refreshScoresAction } from "./actions";
import SubmitButton from "./SubmitButton";

export const revalidate = 0;

export default function AdminRefreshPage() {
  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin: Refresh NFL Scores</h1>

      {/* Pass the server action DIRECTLY – no inline wrapper */}
      <form action={refreshScoresAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Season Label</span>
            <input
              name="seasonLabel"
              defaultValue="2025-2026"
              className="border rounded-lg px-3 py-2"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Season Year</span>
            <input
              name="seasonYear"
              type="number"
              defaultValue={2025}
              className="border rounded-lg px-3 py-2"
            />
          </label>
        </div>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">
            Limit to Week (optional)
          </span>
          <input
            name="week"
            type="number"
            placeholder="e.g. 4"
            className="border rounded-lg px-3 py-2"
          />
        </label>

        <SubmitButton />
      </form>

      <p className="text-sm text-gray-500">
        Only <code>status</code>, <code>homeScore</code>, and{" "}
        <code>awayScore</code> are updated. Missing rows are ignored.
      </p>
    </main>
  );
}
