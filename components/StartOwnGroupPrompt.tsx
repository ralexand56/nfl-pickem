"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "pc:hide-start-own-group";

// Members are the best prospects: they already know the app. A small,
// dismissible nudge to run a group of their own (office, friends, another
// side of the family). Hidden for good once dismissed in this browser.
export default function StartOwnGroupPrompt() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-accent-100 bg-accent-50 px-4 py-3 text-text">
      <p className="text-sm">
        <span className="font-semibold">Run one for your office or friends?</span>{" "}
        Start your own group for $10 a season. Your members play free.
      </p>
      <div className="flex items-center gap-2">
        <Link
          href="/start?utm_source=member_prompt&utm_medium=in_app"
          className="rounded-control bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-900"
        >
          Start a group
        </Link>
        <button
          type="button"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem(KEY, "1");
            } catch {}
          }}
          className="rounded-control px-2 py-1.5 text-sm text-text-muted hover:bg-surface-muted"
          aria-label="Dismiss"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
