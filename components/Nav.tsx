"use client";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import AdminSyncWeekButton from "@/components/AdminSyncWeekButton";
import { getCurrentNflWeek } from "@/lib/sportsdb";
import React from "react";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean;
};

export default function Nav() {
  const { data: session, status } = useSession();
  const [currentWeek, setCurrentWeek] = React.useState<number | null>(null);
  const user = session?.user as User;

  const currentSeason = 2025;

  React.useEffect(() => {
    async function fetchWeek() {
      const week = await getCurrentNflWeek();
      if (week) setCurrentWeek(week);
    }
    fetchWeek();
  }, []);

  if (currentWeek == null) return null; // still loading

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg">
            Alexander NFL Pick’em
          </Link>
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600">
            <Link href="/" className="hover:underline">
              Weeks
            </Link>
            <Link
              href={`/week/${currentSeason}/${currentWeek}/leaderboard`}
              className="hover:underline"
            >
              Leaderboard
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

        <div className="flex items-center gap-3">
          {(user?.isAdmin || user?.email === "ralexand56@gmail.com") && (
            <AdminSyncWeekButton />
          )}
          {status === "loading" && (
            <span className="text-sm text-gray-500">…</span>
          )}
          {status !== "loading" && !user && (
            <button
              onClick={() => signIn(undefined, { callbackUrl: "/" })}
              className="px-3 py-1.5 rounded-lg border"
            >
              Sign in
            </button>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700 hidden sm:inline">
                {user.name ?? user.email}
              </span>
              {user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt="avatar"
                  className="w-8 h-8 rounded-full border"
                />
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 rounded-lg border"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
