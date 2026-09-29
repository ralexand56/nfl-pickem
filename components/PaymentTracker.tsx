"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";
import Card from "@/components/ui/Card";
import type { PaymentPlayer, PaymentViewer } from "@/lib/payments";
import { MAX_METHOD_LENGTH, PAYMENT_METHODS } from "@/lib/payment-methods";

type PaymentChange = { paid?: boolean; method?: string | null };

// Paid/method state for one player, saved optimistically and rolled back if
// the server rejects it.
function usePayment(
  player: PaymentPlayer,
  season: number,
  week: number,
  onError?: (msg: string) => void
) {
  const router = useRouter();
  const [paid, setPaid] = useState(player.paid);
  const [method, setMethod] = useState(player.method);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // What the latest local save expects the server to return. A refresh from
  // an earlier save can land after a newer change; ignore it until the
  // server data catches up.
  const expected = useRef<{ paid: boolean; method: string | null } | null>(null);

  useEffect(() => {
    const exp = expected.current;
    if (exp && (exp.paid !== player.paid || exp.method !== player.method)) return;
    expected.current = null;
    setPaid(player.paid);
    setMethod(player.method);
  }, [player.paid, player.method]);

  async function save(change: PaymentChange) {
    const prev = { paid, method };
    const next = { ...prev, ...change };
    expected.current = next;
    setPaid(next.paid);
    setMethod(next.method);
    setSaved(false);
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({ userId: player.id, season, week, ...change }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        expected.current = null;
        setPaid(prev.paid);
        setMethod(prev.method);
        onError?.(body?.error ?? "Failed to save payment status");
        return;
      }
      router.refresh();
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch {
      expected.current = null;
      setPaid(prev.paid);
      setMethod(prev.method);
      onError?.("Failed to save payment status");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  return { paid, method, saving, saved, save };
}

function canEdit(viewer: PaymentViewer, player: PaymentPlayer) {
  return !!viewer && (viewer.isAdmin || viewer.id === player.id);
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M15 8.5c-.6-.9-1.7-1.5-3-1.5-1.9 0-3 1-3 2.3 0 3.2 6 1.6 6 4.9 0 1.3-1.2 2.3-3 2.3-1.4 0-2.6-.6-3.2-1.6M12 5.5v1.5M12 17v1.5" />
    </svg>
  );
}

// Green dollar = paid, gray = not paid.
function DollarButton({
  player,
  paid,
  method,
  saving,
  editable,
  onToggle,
}: {
  player: PaymentPlayer;
  paid: boolean;
  method: string | null;
  saving: boolean;
  editable: boolean;
  onToggle: () => void;
}) {
  const status = paid ? `Paid${method ? ` via ${method}` : ""}` : "Not paid";
  const by =
    player.updatedByName && player.updatedAt
      ? ` · marked by ${player.updatedByName} on ${new Date(player.updatedAt).toLocaleDateString()}`
      : "";
  const hint = editable ? ` (click to mark ${paid ? "not paid" : "paid"})` : "";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!editable || saving}
      title={`${status}${by}${hint}`}
      aria-label={`${player.name}: ${paid ? "paid" : "not paid"}`}
      aria-pressed={paid}
      className={clsx(
        "shrink-0 inline-flex items-center justify-center rounded-full p-0.5 transition-colors",
        paid ? "text-success" : "text-text-muted opacity-60",
        editable ? "cursor-pointer hover:bg-surface-muted" : "cursor-default",
        saving && "animate-pulse"
      )}
    >
      <DollarIcon className="w-6 h-6" />
    </button>
  );
}

// Standalone toggle (used in the leaderboard table). Clickable for the
// player themselves and for payment admins; read-only for everyone else.
export function PaidToggle({
  player,
  season,
  week,
  viewer,
}: {
  player: PaymentPlayer;
  season: number;
  week: number;
  viewer: PaymentViewer;
}) {
  const { paid, method, saving, save } = usePayment(player, season, week);
  const editable = canEdit(viewer, player);
  return (
    <DollarButton
      player={player}
      paid={paid}
      method={method}
      saving={saving}
      editable={editable}
      onToggle={() => editable && save({ paid: !paid })}
    />
  );
}

const OTHER = "__other__";

function MethodPicker({
  method,
  disabled,
  onSave,
}: {
  method: string | null;
  disabled: boolean;
  onSave: (method: string | null) => void;
}) {
  const isPreset = (m: string | null) =>
    !!m && (PAYMENT_METHODS as readonly string[]).includes(m);
  const choiceFor = (m: string | null) => (!m ? "" : isPreset(m) ? m : OTHER);

  const [choice, setChoice] = useState(choiceFor(method));
  const [otherText, setOtherText] = useState(isPreset(method) ? "" : method ?? "");

  useEffect(() => {
    setChoice(choiceFor(method));
    setOtherText(isPreset(method) ? "" : method ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  function saveOther() {
    const text = otherText.trim();
    if (text && text !== method) onSave(text);
  }

  return (
    <div className="flex items-center gap-1 min-w-0">
      <select
        aria-label="How you paid"
        value={choice}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setChoice(next);
          if (next === OTHER) return; // wait for the text box
          onSave(next || null);
        }}
        className="text-xs rounded-control border border-border bg-surface text-text px-1 py-0.5"
      >
        <option value="">How&apos;d you pay?</option>
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
        <option value={OTHER}>Other…</option>
      </select>
      {choice === OTHER && (
        <input
          type="text"
          aria-label="Other payment method"
          placeholder="e.g. Venmo"
          maxLength={MAX_METHOD_LENGTH}
          value={otherText}
          disabled={disabled}
          onChange={(e) => setOtherText(e.target.value)}
          onBlur={saveOther}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className="text-xs w-24 min-w-0 rounded-control border border-border bg-surface text-text px-1 py-0.5"
        />
      )}
    </div>
  );
}

function PaymentRow({
  player,
  season,
  week,
  viewer,
  onError,
}: {
  player: PaymentPlayer;
  season: number;
  week: number;
  viewer: PaymentViewer;
  onError: (msg: string) => void;
}) {
  const { paid, method, saving, saved, save } = usePayment(
    player,
    season,
    week,
    onError
  );
  const editable = canEdit(viewer, player);

  return (
    <li
      className={clsx(
        "flex items-center gap-1.5 min-w-0 rounded-control px-1 py-0.5",
        player.id === viewer?.id && "bg-surface-muted"
      )}
    >
      <DollarButton
        player={player}
        paid={paid}
        method={method}
        saving={saving}
        editable={editable}
        onToggle={() => editable && save({ paid: !paid })}
      />
      <div className="min-w-0 flex flex-col">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-sm text-text truncate" title={player.name}>
            {player.name}
          </span>
          {saved && (
            <span className="shrink-0 text-xs text-success" role="status">
              Saved
            </span>
          )}
        </div>
        {paid &&
          (editable ? (
            <MethodPicker
              method={method}
              disabled={saving}
              onSave={(m) => save({ method: m })}
            />
          ) : (
            method && (
              <span className="text-xs text-text-muted truncate" title={method}>
                {method}
              </span>
            )
          ))}
      </div>
    </li>
  );
}

export default function PaymentTracker({
  players,
  participantIds,
  season,
  week,
  viewer,
}: {
  players: PaymentPlayer[];
  // Players with picks this week. The list shows these, anyone marked paid,
  // and the viewer; admins can expand it to every user.
  participantIds: string[];
  season: number;
  week: number;
  viewer: PaymentViewer;
}) {
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (showAll) return players;
    const ids = new Set(participantIds);
    return players.filter((p) => ids.has(p.id) || p.paid || p.id === viewer?.id);
  }, [players, participantIds, showAll, viewer?.id]);

  const paidCount = visible.filter((p) => p.paid).length;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-semibold text-text">Who&apos;s paid · Week {week}</h3>
        <span className="text-sm text-text-muted">
          {paidCount} of {visible.length} paid
        </span>
      </div>

      {error && <div className="text-sm text-danger mb-2">{error}</div>}

      {visible.length === 0 ? (
        <div className="text-sm text-text-muted">No players yet this week.</div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1">
          {visible.map((p) => (
            <PaymentRow
              key={p.id}
              player={p}
              season={season}
              week={week}
              viewer={viewer}
              onError={setError}
            />
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>
          {viewer
            ? "Tap your $ to mark yourself paid, then pick how you paid. Green = paid, gray = not paid."
            : "Sign in to mark yourself paid. Green = paid, gray = not paid."}
        </span>
        {viewer?.isAdmin && (
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
            />
            Show all users
          </label>
        )}
      </div>
    </Card>
  );
}
