"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import React, { useEffect } from "react";
import Button from "@/components/ui/Button";
import type { GroupRole } from "@/db/schema";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type NavGroup = {
  slug: string;
  name: string;
  role: GroupRole;
  squaresEnabled: boolean;
};

export default function Nav({ groups }: { groups: NavGroup[] }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const [currentSeason, setCurrentSeason] = React.useState<number | null>(null);
  const user = session?.user as User;

  // The group whose pages we're on, if any; otherwise the user's first group.
  const slugInPath = pathname.match(/^\/g\/([^/]+)/)?.[1];
  const group =
    groups.find((g) => g.slug === slugInPath) ?? (slugInPath ? null : groups[0]);

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

  const base = group ? `/g/${group.slug}` : null;
  const weekPath =
    base && currentWeek != null && currentSeason != null
      ? `${base}/week/${currentSeason}/${currentWeek}`
      : null;

  const links = base && (
    <>
      <Link href={base} className="hover:underline">
        Weeks
      </Link>
      {weekPath && (
        <>
          <Link href={`${weekPath}/leaderboard`} className="hover:underline">
            Leaderboard
          </Link>
          <Link href={weekPath} className="hover:underline">
            My Picks
          </Link>
        </>
      )}
      {group?.squaresEnabled && (
        <Link href={`${base}/squares`} className="hover:underline">
          Squares
        </Link>
      )}
      {group?.role === "admin" && (
        <Link href={`${base}/admin`} className="hover:underline">
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur border-b border-border">
      <nav className="flex-col sm:flex-row max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <Link
            href={base ?? "/"}
            className="font-bold text-lg text-text flex items-center gap-2"
          >
            The Pick&rsquo;em Club
            <span className="rounded bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-900">
              NFL
            </span>
          </Link>
          {groups.length > 1 ? (
            <select
              title="Switch group"
              value={group?.slug ?? ""}
              onChange={(e) => router.push(`/g/${e.target.value}`)}
              className="px-2 py-1 rounded-control border border-border bg-surface text-sm text-text"
            >
              {!group && <option value="">Choose a group</option>}
              {groups.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
          ) : (
            group && <span className="text-sm text-text-muted">{group.name}</span>
          )}
          <div className="hidden sm:flex items-center gap-3 text-sm text-text-muted">
            {links}
          </div>
        </div>
        <div className="flex-col flex items-center gap-3">
          {status === "loading" && (
            <span className="text-sm text-text-muted">…</span>
          )}
          {status !== "loading" && !user && (
            <Button size="sm" onClick={() => signIn(undefined, { callbackUrl: pathname })}>
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
          {links && (
            <div className="sm:hidden flex justify-between items-center gap-3 text-sm text-text-muted">
              {links}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
