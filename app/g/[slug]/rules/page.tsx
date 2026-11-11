import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Card from "@/components/ui/Card";
import { getGroupContext } from "@/lib/group";
import { hidesTiebreakerGuesses } from "@/lib/group-settings";

export const dynamic = "force-dynamic";

// The group's rules in plain English, written from its admin settings, so
// they always match how the site actually behaves.
export default async function RulesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getGroupContext(slug);
  if (!ctx) notFound();
  const s = ctx.settings;
  const base = `/g/${slug}`;

  const picksLock =
    s.pickDeadline === "week"
      ? "All picks lock when the first game of the week kicks off (usually Thursday night). After that, no picks can be made or changed for the rest of the week."
      : "Each game locks at its own kickoff. You can make or change picks for later games until they start.";

  const tiebreakerLocks =
    s.tiebreakerDeadline === "week"
      ? "when the first game of the week kicks off"
      : "when the tiebreaker game kicks off";

  const methods = new Intl.ListFormat("en", { type: "disjunction" }).format(s.paymentMethods);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-text text-balance">{ctx.group.name} rules</h1>
      <p className="text-text-muted mt-2 mb-6">
        These come from your group&apos;s settings, so they&apos;re always current.
        {ctx.viewer.isAdmin && (
          <>
            {" "}
            <a href={`${base}/admin`} className="text-brand-600 hover:underline">
              Change them in Admin
            </a>
            .
          </>
        )}
      </p>

      <div className="grid gap-4">
        <Section title="Making picks">
          <Rule>Pick the winner of every game each week.</Rule>
          <Rule>
            {s.includePlayoffs
              ? "We play all 18 regular-season weeks plus the playoffs (Wild Card through Conference Championships)."
              : "We play the 18 regular-season weeks. Playoff weeks aren't included."}
          </Rule>
          <Rule>{picksLock}</Rule>
          <Rule>A game you don&apos;t pick counts as a miss.</Rule>
        </Section>

        <Section title="Winning the week">
          <Rule>Each correct pick is worth one point. The most correct picks wins the week.</Rule>
          {s.tiebreakerEnabled ? (
            <>
              <Rule>
                Ties are broken by guessing the total points scored in the tiebreaker game,
                usually the last game of the week (Monday night). Closest guess wins, whether
                over or under.
              </Rule>
              <Rule>Your tiebreaker guess locks {tiebreakerLocks}.</Rule>
              <Rule>If you don&apos;t enter a guess, you lose a tie to anyone who did.</Rule>
            </>
          ) : (
            <Rule>There&apos;s no tiebreaker, so people with the same number of correct picks are tied.</Rule>
          )}
        </Section>

        <Section title="Who sees what">
          <Rule>Everyone can see who has finished their picks.</Rule>
          <Rule>
            {s.hidePicksUntilLock
              ? "Your picks are private until they lock. Then everyone's picks are shown."
              : "Everyone's picks are visible as soon as they're made."}
          </Rule>
          {s.tiebreakerEnabled && (
            <Rule>
              {hidesTiebreakerGuesses(s)
                ? "Tiebreaker guesses are private until the tiebreaker locks. Then everyone's guess is shown."
                : "Tiebreaker guesses are visible as soon as they're entered."}
            </Rule>
          )}
        </Section>

        {s.buyInEnabled && (
          <Section title="Weekly buy-in">
            <Rule>
              The buy-in is ${s.buyInAmount} per week
              {methods ? `, paid by ${methods}` : ""}.
            </Rule>
            <Rule>After you pay, mark yourself paid on the week&apos;s picks page. An admin can also mark it for you.</Rule>
          </Section>
        )}

        {s.autoRemindersEnabled && (
          <Section title="Reminders">
            <Rule>
              If you&apos;ve started your picks but haven&apos;t finished, you&apos;ll get an email
              about an hour before they lock. Each email has a link to turn these off.
            </Rule>
          </Section>
        )}

        {s.squaresEnabled && (
          <Section title="Super Bowl squares">
            <Rule>
              The group runs a Super Bowl squares board.{" "}
              <a href={`${base}/squares`} className="text-brand-600 hover:underline">
                See the board
              </a>{" "}
              for the price per square, how the numbers are drawn, and the payouts.
            </Rule>
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-text mb-2">{title}</h2>
      <ul className="list-disc pl-5 space-y-1.5 text-text">{children}</ul>
    </Card>
  );
}

function Rule({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}
