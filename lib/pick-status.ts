// How far one member has got with a week's picks. Client-safe: the status bar
// and the "Who's in" list share it, and it follows the group's game rules.
import {
  pickDeadlineMs,
  tiebreakerDeadlineMs,
  type GroupSettings,
} from "@/lib/group-settings";

type StatusGame = {
  id: string;
  date: Date | string;
  status?: string | null;
  isTiebreaker?: boolean | null;
};

export type PickStatus = {
  total: number;
  picked: number;
  // Unpicked games that can no longer be picked.
  missed: number;
  firstOpenGameId: string | null;
  tiebreakerMissing: boolean;
  tiebreakerOpen: boolean;
  complete: boolean;
  canStillFinish: boolean;
  notStarted: boolean;
  rule: GroupSettings["pickDeadline"];
};

export function getPickStatus({
  games,
  pickedGameIds,
  hasTiebreaker,
  settings,
  nowMs,
}: {
  games: StatusGame[];
  pickedGameIds: Set<string>;
  hasTiebreaker: boolean;
  settings: Pick<
    GroupSettings,
    "tiebreakerEnabled" | "pickDeadline" | "tiebreakerDeadline"
  >;
  nowMs: number;
}): PickStatus {
  const rule = settings.pickDeadline;
  const isLocked = (g: StatusGame) =>
    g.status === "final" || nowMs >= pickDeadlineMs(rule, g, games);
  const byKickoff = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const unpicked = byKickoff.filter((g) => !pickedGameIds.has(g.id));
  const open = unpicked.filter((g) => !isLocked(g));

  const tiebreakerMissing = settings.tiebreakerEnabled && !hasTiebreaker;
  const tiebreakerOpen =
    tiebreakerMissing &&
    games.length > 0 &&
    nowMs < tiebreakerDeadlineMs(settings.tiebreakerDeadline, games);

  const picked = games.length - unpicked.length;
  return {
    total: games.length,
    picked,
    missed: unpicked.length - open.length,
    firstOpenGameId: open[0]?.id ?? null,
    tiebreakerMissing,
    tiebreakerOpen,
    complete: unpicked.length === 0 && !tiebreakerMissing,
    canStillFinish: open.length > 0 || tiebreakerOpen,
    // Nothing entered yet, and everything is still open.
    notStarted: picked === 0 && open.length === games.length && !hasTiebreaker,
    rule,
  };
}

// What comes after the pick count: "tiebreaker missing", "2 missed", "locked".
function statusNotes(s: PickStatus) {
  const notes: string[] = [];
  if (s.tiebreakerMissing) notes.push("tiebreaker missing");
  // Missed picks are worth calling out while something else can still be
  // finished; once a whole week has closed, "locked" says it.
  if (s.missed > 0 && (s.rule === "game" || s.canStillFinish)) {
    notes.push(`${s.missed} missed`);
  } else if (!s.canStillFinish) {
    notes.push("locked");
  }
  return notes;
}

// Short label for the "Who's in" list. Counts only, never the picks.
export function pickStatusLabel(s: PickStatus) {
  if (s.complete) return "All in";
  if (s.notStarted) return "Not started";
  const notes = statusNotes(s);
  if (s.picked === s.total) {
    const text = notes.join(" · ");
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return [`${s.picked} of ${s.total}`, ...notes].join(" · ");
}

// Fuller wording for the viewer's own status bar.
export function pickStatusSummary(s: PickStatus) {
  return [`${s.picked} of ${s.total} picks`, ...statusNotes(s)].join(" · ");
}
