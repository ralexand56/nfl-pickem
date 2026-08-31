"use client";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import React, { useEffect } from "react";
import Button from "@/components/ui/Button";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
};

export default function Nav() {
  const { data: session, status } = useSession();
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [currentSeason, setCurrentSeason] = React.useState<number | null>(null);
  const user = session?.user as User;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/current-week", { cache: "no-store" });
        const j = await r.json();
        if (!cancelled) {
          setCurrentWeek(j.week ?? null);
          setCurrentSeason(j.season ?? null);
        }
      } catch {
        if (!cancelled) {
          setCurrentWeek(null);
          setCurrentSeason(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (currentWeek == null || currentSeason == null) return null; // still loading

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border">
      <nav className="flex-col sm:flex-row max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg text-text">
            Alexander NFL Pick’em
          </Link>
          <div className="hidden sm:flex items-center gap-3 text-sm text-text-muted">
            <Link href="/" className="hover:underline">
              Weeks
            </Link>
            <Link
              href={`/week/${currentSeason}/${currentWeek}/leaderboard`}
              className="hover:underline"
            >
              Leaderboard
            </Link>
            <Link href="/squares" className="hover:underline">
              Squares
            </Link>
            {user && (
              <Link
                href={`/week/${currentSeason}/${currentWeek}`}
                className="hover:underline"
              >
                My Picks
              </Link>
            )}
          </div>
        </div>
        <div className="flex-col flex items-center gap-3">
          {status === "loading" && (
            <span className="text-sm text-text-muted">…</span>
          )}
          {status !== "loading" && !user && (
            <Button size="sm" onClick={() => signIn(undefined, { callbackUrl: "/" })}>
              Sign in
            </Button>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-text hidden sm:inline">
                {user.name ?? user.email}
              </span>
              {user.image && (
                <Image
                  src={user.image}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full border border-border"
                />
              )}
              <Button size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign out
              </Button>
            </div>
          )}
          <div className="sm:hidden flex justify-between items-center gap-3 text-sm text-text-muted">
            <Link href="/" className="hover:underline">
              Weeks
            </Link>
            <Link
              href={`/week/${currentSeason}/${currentWeek}/leaderboard`}
              className="hover:underline"
            >
              Leaderboard
            </Link>
            <Link href="/squares" className="hover:underline">
              Squares
            </Link>
            {user && (
              <Link
                href={`/week/${currentSeason}/${currentWeek}`}
                className="hover:underline"
              >
                My Picks
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
