import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GroupProvider } from "@/components/GroupProvider";
import { getGroupContext, getViewerId, isSeasonActive } from "@/lib/group";
import { getCurrentNfl } from "@/lib/server";

// Private to members; keep out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function GroupLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!(await getViewerId())) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(`/g/${slug}`)}`);
  }
  // Non-members get the same 404 as a group that doesn't exist, so group
  // slugs can't be probed.
  const ctx = await getGroupContext(slug);
  if (!ctx) notFound();

  const { season } = await getCurrentNfl();
  const inactiveSeason =
    season != null && !(await isSeasonActive(ctx.group.id, season)) ? season : null;

  return (
    <GroupProvider
      group={{
        slug: ctx.group.slug,
        name: ctx.group.name,
        isAdmin: ctx.viewer.isAdmin,
        settings: ctx.settings,
      }}
    >
      {inactiveSeason && (
        <div className="bg-warning-muted text-text text-sm text-center px-4 py-2">
          {ctx.viewer.isAdmin ? (
            <>
              {ctx.group.name} isn&apos;t active for the {inactiveSeason} season.{" "}
              <a href={`/g/${slug}/admin`} className="underline font-medium">
                Renew for $10
              </a>{" "}
              so everyone can make picks.
            </>
          ) : (
            <>
              {ctx.group.name} isn&apos;t active for the {inactiveSeason} season yet.
              You can look around, but picks open once your admin renews.
            </>
          )}
        </div>
      )}
      {children}
    </GroupProvider>
  );
}
