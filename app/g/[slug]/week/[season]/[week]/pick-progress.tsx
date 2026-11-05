"use client";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  pickStatusLabel,
  pickStatusSummary,
  type PickStatus,
} from "@/lib/pick-status";

// Stays in view at the bottom of the screen while the viewer works through
// the week, and jumps to whatever they've skipped.
export function PickStatusBar({
  status,
  weekLabel,
  tiebreakerInputId,
}: {
  status: PickStatus;
  weekLabel: string;
  tiebreakerInputId: string;
}) {
  function jumpToNext() {
    const input = status.firstOpenGameId
      ? null
      : document.getElementById(tiebreakerInputId);
    const target =
      input?.closest<HTMLElement>("[data-pick-target]") ??
      (status.firstOpenGameId &&
        document.getElementById(`game-${status.firstOpenGameId}`));
    if (!target) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    input?.focus({ preventScroll: true });
  }

  return (
    <div
      role="status"
      className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 mt-6"
    >
      <Card
        className={clsx(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 font-semibold text-text",
          status.complete && "bg-success-muted border-transparent"
        )}
      >
        <span>
          {status.complete
            ? `You’re all set for ${weekLabel} ✓`
            : pickStatusSummary(status)}
        </span>
        {status.canStillFinish && (
          <button
            type="button"
            onClick={jumpToNext}
            className="rounded-control bg-brand-600 px-3 py-1.5 text-sm text-white cursor-pointer hover:bg-brand-700"
          >
            {status.firstOpenGameId ? "Next pick" : "Add tiebreaker"}
          </button>
        )}
      </Card>
    </div>
  );
}

// Every member of the group and how far along they are. Counts only.
export function WhosIn({
  members,
  viewerId,
}: {
  members: { id: string; name: string; status: PickStatus }[];
  viewerId?: string;
}) {
  const allIn = members.filter((m) => m.status.complete).length;
  return (
    // Starts closed for big groups so the list doesn't push the games down.
    <details
      open={members.length <= 12}
      className="mb-6 rounded-card border border-border bg-surface shadow-card p-4"
    >
      <summary className="cursor-pointer font-semibold text-text">
        Who’s in · {allIn} of {members.length}
      </summary>
      <ul className="mt-3 grid max-h-80 gap-x-6 gap-y-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-text">
              {m.name}
              {m.id === viewerId && <span className="text-text-muted"> (you)</span>}
            </span>
            <Badge
              tone={
                m.status.complete
                  ? "success"
                  : m.status.canStillFinish
                    ? "warning"
                    : "neutral"
              }
              className="shrink-0"
            >
              {pickStatusLabel(m.status)}
            </Badge>
          </li>
        ))}
      </ul>
    </details>
  );
}
