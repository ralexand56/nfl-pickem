"use client";
import { useEffect, useState } from "react";

const base = process.env.THESPORTSDB_API_BASE!; // e.g. https://www.thesportsdb.com/api/v1/json
const key = process.env.THESPORTSDB_API_KEY!; // free test key "123" ok for dev

export default function AdminSyncWeekButton() {
  const [seasonWeek, setSeasonWeek] = useState<{
    season: number;
    week: number;
  } | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${base}/api/active-week`)
      .then((r) => r.json())
      .then(setSeasonWeek)
      .catch(() => setSeasonWeek(null));
  }, []);

  async function syncNow() {
    if (!seasonWeek) return;
    setLoading(true);
    setStatus("Syncing…");
    try {
      const res = await fetch("/api/sync/week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(seasonWeek),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Sync failed");
      setStatus(
        `Synced ${json.count} games for S${seasonWeek.season} W${seasonWeek.week}`
      );
    } catch (e: unknown) {
      if (e instanceof Error) {
        setStatus(e.message || "Sync error");
      } else {
        setStatus("Sync error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={syncNow}
        disabled={!seasonWeek || loading}
        className="px-3 py-1.5 rounded-lg border"
        title={
          seasonWeek
            ? `Sync S${seasonWeek.season} W${seasonWeek.week}`
            : "No active week yet"
        }
      >
        {loading ? "Syncing…" : "Sync this week"}
      </button>
      {status && <span className="text-xs text-gray-600">{status}</span>}
    </div>
  );
}
