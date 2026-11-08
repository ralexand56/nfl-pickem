"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useGroup } from "@/components/GroupProvider";
import { useToast } from "@/components/Toast";
import {
  pickStatusLabel,
  pickStatusSummary,
  type PickStatus,
} from "@/lib/pick-status";
import { sendPickRemindersAction } from "./actions";

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

type MemberProgress = { id: string; name: string; status: PickStatus };

// Every member of the group and how far along they are. Counts only.
export function WhosIn({
  members,
  viewerId,
  reminders,
  season,
  week,
}: {
  members: MemberProgress[];
  viewerId?: string;
  reminders: { playedThisSeason: string[]; remindedRecently: string[] } | null;
  season: number;
  week: number;
}) {
  const [reminding, setReminding] = useState(false);
  const allIn = members.filter((m) => m.status.complete).length;
  const unfinished = members.filter(
    (m) => !m.status.complete && m.status.canStillFinish
  );
  return (
    <div className="mb-6 rounded-card border border-border bg-surface shadow-card p-4">
      {/* Starts closed for big groups so the list doesn't push the games down. */}
      <details open={members.length <= 12}>
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

      {reminders && unfinished.length > 0 && !reminding && (
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => setReminding(true)}
        >
          Remind members
        </Button>
      )}
      {reminders && reminding && (
        <RemindPanel
          unfinished={unfinished}
          reminders={reminders}
          season={season}
          week={week}
          onClose={() => setReminding(false)}
        />
      )}
    </div>
  );
}

// Admin only. The admin chooses who gets an email; people who've played this
// season start checked, since long-inactive members probably don't want one.
function RemindPanel({
  unfinished,
  reminders,
  season,
  week,
  onClose,
}: {
  unfinished: MemberProgress[];
  reminders: { playedThisSeason: string[]; remindedRecently: string[] };
  season: number;
  week: number;
  onClose: () => void;
}) {
  const group = useGroup();
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const recent = new Set(reminders.remindedRecently);
  const [chosen, setChosen] = useState(
    () =>
      new Set(
        unfinished
          .map((m) => m.id)
          .filter((id) => reminders.playedThisSeason.includes(id) && !recent.has(id))
      )
  );
  // People can finish, or a game can lock, while the panel is open.
  const toSend = unfinished.filter((m) => chosen.has(m.id) && !recent.has(m.id));

  function toggle(id: string) {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function send() {
    start(async () => {
      try {
        const result = await sendPickRemindersAction(
          group.slug,
          season,
          week,
          toSend.map((m) => m.id)
        );
        const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;
        if (result.failed > 0) {
          toast.error(
            `Sent to ${people(result.sent)}, but ${result.failed} failed. Try again in a bit.`
          );
        } else {
          toast.success(`Reminder sent to ${people(result.sent)}`);
        }
        router.refresh();
        onClose();
      } catch {
        toast.error("Couldn't send reminders");
      }
    });
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="font-semibold text-text">Email a reminder</h3>
      <p className="text-sm text-text-muted mb-3">
        Goes to members who can still finish. Each person gets at most one
        every 12 hours.
      </p>
      <ul className="grid max-h-64 gap-x-6 gap-y-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {unfinished.map((m) => (
          <li key={m.id} className="text-sm">
            <label
              className={clsx(
                "flex items-center gap-2 text-text",
                recent.has(m.id) ? "opacity-60" : "cursor-pointer"
              )}
            >
              <input
                type="checkbox"
                checked={chosen.has(m.id) && !recent.has(m.id)}
                disabled={recent.has(m.id)}
                onChange={() => toggle(m.id)}
              />
              <span className="min-w-0 truncate">
                {m.name}
                {recent.has(m.id) && (
                  <span className="text-text-muted"> (reminded recently)</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          onClick={send}
          disabled={pending || toSend.length === 0}
        >
          {pending
            ? "Sending…"
            : `Send to ${toSend.length} ${toSend.length === 1 ? "person" : "people"}`}
        </Button>
        <Button variant="secondary" size="sm" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
