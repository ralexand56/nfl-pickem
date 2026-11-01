"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/Toast";

export default function StartForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  // Opt-in only: automatic renewal is off unless they check it.
  const [autoRenew, setAutoRenew] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !agreed) return;
    setRedirecting(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ kind: "create", name, agreed, autoRenew }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) throw new Error(body?.error);
      window.location.href = body.url;
    } catch (err) {
      setRedirecting(false);
      toast.error(
        err instanceof Error && err.message ? err.message : "Couldn't start checkout"
      );
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="block text-sm font-medium text-text mb-1">Group name</span>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="e.g. Sunday Squad or The Johnson Family"
          className="w-full"
          required
        />
      </label>
      <AutoRenewCheckbox checked={autoRenew} onChange={setAutoRenew} />
      <label className="flex items-start gap-2 text-sm text-text cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
        />
        <span>
          I&apos;m 18 or older and I agree to the{" "}
          <a href="/terms" target="_blank" className="text-brand-600 underline">
            Terms of Service
          </a>
          .
        </span>
      </label>
      <Button
        type="submit"
        variant="primary"
        className="w-full py-3"
        disabled={redirecting || !name.trim() || !agreed}
      >
        {redirecting ? "Opening secure checkout…" : "Continue to payment · $10"}
      </Button>
      <p className="text-xs text-text-muted text-center">
        {autoRenew
          ? "$10 today, then $10 every August 15 until you turn it off."
          : "One-time payment for this NFL season. Nothing renews automatically."}
      </p>
    </form>
  );
}

// California's auto-renewal law wants the terms right next to an unchecked
// box, before payment.
export function AutoRenewCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-text cursor-pointer rounded-control border border-border p-3">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="font-medium">Automatically renew each NFL season</span>
        <span className="block text-text-muted">
          We&apos;ll charge $10 to this card every August 15, before the season
          starts, until you turn it off. We&apos;ll email a reminder before each
          renewal, and you can turn it off anytime from your admin page.
        </span>
      </span>
    </label>
  );
}
