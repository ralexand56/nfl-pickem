"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/Toast";
import { useGroup } from "@/components/GroupProvider";
import type { GroupRole } from "@/db/schema";
import {
  PICK_DEADLINES,
  TIEBREAKER_DEADLINES,
  type GroupSettings,
} from "@/lib/group-settings";
import {
  removeMemberAction,
  resetInviteAction,
  saveSettingsAction,
  setAutoRenewAction,
  setRoleAction,
} from "./actions";
import { AutoRenewCheckbox } from "@/app/start/start-form";

type Member = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: GroupRole;
};

type Season = { season: number; status: "paid" | "comped" };

export default function AdminPanel({
  viewerId,
  name,
  settings,
  inviteToken,
  members,
  seasons,
  currentSeason,
  compedForever,
  autoRenew,
  hasSubscription,
  renewsAt,
}: {
  viewerId: string;
  name: string;
  settings: GroupSettings;
  inviteToken: string;
  members: Member[];
  seasons: Season[];
  currentSeason: number;
  compedForever: boolean;
  autoRenew: boolean;
  hasSubscription: boolean;
  renewsAt: string | null;
}) {
  return (
    <>
      <SeasonCard
        seasons={seasons}
        currentSeason={currentSeason}
        compedForever={compedForever}
        autoRenew={autoRenew}
        hasSubscription={hasSubscription}
        renewsAt={renewsAt}
      />
      <InviteCard inviteToken={inviteToken} />
      <MembersCard members={members} viewerId={viewerId} />
      <SettingsCard name={name} settings={settings} />
    </>
  );
}

// Run a server action with a toast for the outcome and a refresh on success.
function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  function run(fn: () => Promise<unknown>, success: string) {
    start(async () => {
      try {
        await fn();
        router.refresh();
        toast.success(success);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }
  return { pending, run };
}

function SeasonCard({
  seasons,
  currentSeason,
  compedForever,
  autoRenew,
  hasSubscription,
  renewsAt,
}: {
  seasons: Season[];
  currentSeason: number;
  compedForever: boolean;
  autoRenew: boolean;
  hasSubscription: boolean;
  renewsAt: string | null;
}) {
  const { slug } = useGroup();
  const toast = useToast();
  const [redirecting, setRedirecting] = useState(false);
  const [renewAuto, setRenewAuto] = useState(false);
  const { pending, run } = useAction();
  const active = seasons.find((s) => s.season === currentSeason);
  const renewDate = renewsAt
    ? new Date(renewsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (compedForever) {
    return (
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-text">{currentSeason} season</h2>
            <p className="text-sm text-text-muted">
              Free forever. This group never needs to renew.
            </p>
          </div>
          <Badge tone="success">Active</Badge>
        </div>
      </Card>
    );
  }

  async function renew() {
    setRedirecting(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ kind: "renew", group: slug, autoRenew: renewAuto }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) throw new Error(body?.error);
      window.location.href = body.url;
    } catch (e) {
      setRedirecting(false);
      toast.error(
        e instanceof Error && e.message ? e.message : "Couldn't start checkout"
      );
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-text">{currentSeason} season</h2>
          <p className="text-sm text-text-muted">
            {active
              ? active.status === "comped"
                ? "Active (complimentary)."
                : "Active. Thanks for playing!"
              : "Not active yet. Members can view past seasons but can't make picks until it's renewed."}
          </p>
        </div>
        {active ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Button variant="primary" onClick={renew} disabled={redirecting}>
            {redirecting ? "Opening checkout…" : `Renew for ${currentSeason} · $10`}
          </Button>
        )}
      </div>

      {!active && (
        <div className="mt-3">
          <AutoRenewCheckbox checked={renewAuto} onChange={setRenewAuto} />
        </div>
      )}

      {hasSubscription && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="text-sm text-text-muted">
            {autoRenew
              ? `Automatic renewal is on: $10 on ${renewDate ?? "August 15"} for next season.`
              : `Automatic renewal is off. Nothing will be charged${renewDate ? ` on ${renewDate}` : ""}.`}
          </p>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setAutoRenewAction(slug, !autoRenew),
                autoRenew ? "Automatic renewal turned off" : "Automatic renewal turned back on"
              )
            }
          >
            {autoRenew ? "Turn off" : "Turn back on"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function InviteCard({ inviteToken }: { inviteToken: string }) {
  const { slug } = useGroup();
  const toast = useToast();
  const { pending, run } = useAction();
  // The origin is only known in the browser; render the path until then.
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/join/${inviteToken}`;

  return (
    <Card>
      <h2 className="font-semibold text-text mb-1">Invite link</h2>
      <p className="text-sm text-text-muted mb-3">
        Anyone with this link can join after signing in. Share it in your group
        chat. Reset it to stop the old link from working.
      </p>
      <div className="flex gap-2">
        <Input readOnly value={url} className="flex-1 text-sm" aria-label="Invite link" />
        <Button
          variant="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast.success("Invite link copied");
            } catch {
              toast.error("Couldn't copy. Select the link and copy it manually.");
            }
          }}
        >
          Copy
        </Button>
        <Button
          disabled={pending}
          onClick={() => {
            if (!confirm("Reset the invite link? The current link will stop working.")) return;
            run(() => resetInviteAction(slug), "Invite link reset");
          }}
        >
          Reset
        </Button>
      </div>
    </Card>
  );
}

function MembersCard({ members, viewerId }: { members: Member[]; viewerId: string }) {
  const { slug } = useGroup();
  const { pending, run } = useAction();

  return (
    <Card>
      <h2 className="font-semibold text-text mb-3">
        Members <span className="text-text-muted font-normal">({members.length})</span>
      </h2>
      <ul className="divide-y divide-border">
        {members.map((m) => {
          const label = m.name || m.email || "Unknown";
          return (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0">
                <div className="text-text truncate">
                  {label}
                  {m.id === viewerId && <span className="text-text-muted"> (you)</span>}
                </div>
                {m.name && m.email && (
                  <div className="text-xs text-text-muted truncate">{m.email}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {m.role === "admin" && <Badge tone="brand">Admin</Badge>}
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => setRoleAction(slug, m.id, m.role === "admin" ? "member" : "admin"),
                      m.role === "admin" ? `${label} is no longer an admin` : `${label} is now an admin`
                    )
                  }
                >
                  {m.role === "admin" ? "Remove admin" : "Make admin"}
                </Button>
                {m.id !== viewerId && (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Remove ${label} from the group?`)) return;
                      run(() => removeMemberAction(slug, m.id), `${label} removed`);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-text">{label}</span>
        <span className="block text-sm text-text-muted">{description}</span>
      </span>
    </label>
  );
}

function SettingsCard({ name, settings }: { name: string; settings: GroupSettings }) {
  const { slug } = useGroup();
  const { pending, run } = useAction();
  const [groupName, setGroupName] = useState(name);
  const [s, setS] = useState(settings);
  const [methodsText, setMethodsText] = useState(settings.paymentMethods.join(", "));
  const set = <K extends keyof GroupSettings>(k: K, v: GroupSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  function save() {
    const paymentMethods = methodsText
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    run(() => saveSettingsAction(slug, groupName, { ...s, paymentMethods }), "Settings saved");
  }

  return (
    <Card>
      <h2 className="font-semibold text-text mb-4">Settings</h2>
      <div className="space-y-6">
        <section className="space-y-2">
          <label className="block text-sm font-medium text-text" htmlFor="group-name">
            Group name
          </label>
          <Input
            id="group-name"
            value={groupName}
            maxLength={60}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full"
          />
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
            Game rules
          </h3>
          <Toggle
            label="Monday night tiebreaker"
            description="Players guess total points in the week's last game to break ties."
            checked={s.tiebreakerEnabled}
            onChange={(v) => set("tiebreakerEnabled", v)}
          />
          {s.tiebreakerEnabled && (
            <fieldset className="space-y-1 pl-7">
              <legend className="text-text mb-1">Tiebreaker deadline</legend>
              {Object.entries(TIEBREAKER_DEADLINES).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                  <input
                    type="radio"
                    name="tiebreakerDeadline"
                    checked={s.tiebreakerDeadline === value}
                    onChange={() => set("tiebreakerDeadline", value as GroupSettings["tiebreakerDeadline"])}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          <Toggle
            label="Hide picks until they lock"
            description="Members can't see each other's picks or tiebreaker guesses until the deadline. Everyone can still see who's finished."
            checked={s.hidePicksUntilLock}
            onChange={(v) => set("hidePicksUntilLock", v)}
          />
          <Toggle
            label="Automatic pick reminders"
            description="About an hour before picks lock, emails members who started their picks but haven't finished. Each email has a link to opt out."
            checked={s.autoRemindersEnabled}
            onChange={(v) => set("autoRemindersEnabled", v)}
          />
          <Toggle
            label="Include playoff weeks"
            description="Wild Card through Conference Championship weeks."
            checked={s.includePlayoffs}
            onChange={(v) => set("includePlayoffs", v)}
          />
          <fieldset className="space-y-1">
            <legend className="text-text mb-1">Pick deadline</legend>
            {Object.entries(PICK_DEADLINES).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm text-text cursor-pointer">
                <input
                  type="radio"
                  name="pickDeadline"
                  checked={s.pickDeadline === value}
                  onChange={() => set("pickDeadline", value as GroupSettings["pickDeadline"])}
                />
                {label}
              </label>
            ))}
          </fieldset>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
            Weekly buy-in
          </h3>
          <Toggle
            label="Track weekly buy-ins"
            description="Shows who's paid on the picks and leaderboard pages. Money is handled between your members; the app just keeps track."
            checked={s.buyInEnabled}
            onChange={(v) => set("buyInEnabled", v)}
          />
          {s.buyInEnabled && (
            <div className="grid sm:grid-cols-2 gap-3 pl-7">
              <label className="text-sm text-text">
                Amount per week ($)
                <Input
                  type="number"
                  min={0}
                  value={s.buyInAmount}
                  onChange={(e) => set("buyInAmount", Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className="w-full mt-1"
                />
              </label>
              <label className="text-sm text-text">
                Payment methods (comma separated)
                <Input
                  value={methodsText}
                  onChange={(e) => setMethodsText(e.target.value)}
                  placeholder="Cash App, Zelle, Venmo"
                  className="w-full mt-1"
                />
              </label>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-text uppercase tracking-wide">
            Super Bowl squares
          </h3>
          <Toggle
            label="Super Bowl squares"
            description="A 10×10 board members claim squares on, with random numbers drawn once it's full."
            checked={s.squaresEnabled}
            onChange={(v) => set("squaresEnabled", v)}
          />
        </section>

        <div className="flex justify-end">
          <Button variant="primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
