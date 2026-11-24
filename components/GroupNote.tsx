"use client";

import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

// Which note a member hid, so it stays hidden until the admins change it.
const storageKey = (slug: string) => `group-note-hidden:${slug}`;

function readHidden(slug: string): string | null {
  try {
    return localStorage.getItem(storageKey(slug));
  } catch {
    return null;
  }
}

const noopSubscribe = () => () => {};

// The admins' note, at the top of every group page. Members can hide it; a
// changed note shows again. It's always on the rules page too.
export default function GroupNote({
  slug,
  note,
  rulesHref,
}: {
  slug: string;
  note: string;
  rulesHref: string;
}) {
  // Server render and first paint show the note; the browser then applies
  // the member's "hide", which only it knows.
  const storedHidden = useSyncExternalStore(
    noopSubscribe,
    () => readHidden(slug),
    () => null
  );
  const [hiddenNow, setHiddenNow] = useState<string | null>(null);
  // The rules page shows the full note itself.
  const onRulesPage = usePathname() === rulesHref;
  if (!note || onRulesPage || storedHidden === note || hiddenNow === note) return null;

  function hide() {
    setHiddenNow(note);
    try {
      localStorage.setItem(storageKey(slug), note);
    } catch {
      // Private mode or blocked storage: hidden for this visit only.
    }
  }

  // A quiet note, not a banner: small muted text, two lines at most, with
  // the full text on the rules page.
  return (
    <div className="max-w-5xl mx-auto px-6 pt-4">
      <aside
        aria-label="Note from your group admin"
        className="flex items-start gap-3 border-l-2 border-accent-500 pl-3 text-sm text-text-muted"
      >
        <p className="min-w-0 flex-1 line-clamp-2 whitespace-pre-line break-words">
          <span className="font-medium text-text">Note: </span>
          {note}
        </p>
        <span className="flex shrink-0 gap-3">
          <a href={rulesHref} className="hover:underline">
            More
          </a>
          <button type="button" onClick={hide} className="hover:underline cursor-pointer">
            Hide
          </button>
        </span>
      </aside>
    </div>
  );
}
