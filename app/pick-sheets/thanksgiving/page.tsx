import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import PickSheet from "@/components/PickSheet";
import PrintButton from "@/components/PrintButton";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import { getThanksgivingGames, thanksgivingDay } from "@/lib/pick-sheets";
import { getCurrentNfl } from "@/lib/server";

// Seasonal page for "Thanksgiving NFL pick sheet" searches each November.
// Schedules change rarely; refresh hourly.
export const revalidate = 3600;

async function season() {
  return (await getCurrentNfl()).season ?? new Date().getFullYear();
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await season();
  return {
    title: { absolute: `Thanksgiving NFL Pick Sheet ${s} – Free Printable | The Pick’em Club` },
    description: `Free printable Thanksgiving ${s} NFL pick sheet with all three Thanksgiving Day games, kickoff times and a tiebreaker. Plus easy house rules for a family pick’em at the table.`,
    alternates: { canonical: "/pick-sheets/thanksgiving" },
  };
}

const IDEAS: [string, string][] = [
  ["Everyone picks, even the kids", "Little ones can pick by helmet color or mascot. They win more often than you’d think."],
  ["Play for something other than money", "Winner skips dish duty, gets first pick of pie, or claims the wishbone."],
  ["Use the tiebreaker", "Guess the total points in the night game. Closest without going over takes it."],
  ["Lock picks at the first kickoff", "Collect sheets before the early game so nobody changes a pick at halftime."],
];

const FAQS: [string, string][] = [
  [
    "Which NFL games are on Thanksgiving?",
    "Three: an early game hosted by the Detroit Lions, an afternoon game hosted by the Dallas Cowboys, and a night game. Matchups and kickoff times are on the sheet above.",
  ],
  [
    "How do you score a Thanksgiving pick’em?",
    "One point for each winner you pick correctly. If people tie, the tiebreaker (total points in the night game) decides it.",
  ],
  [
    "Can we do it on our phones instead of paper?",
    "Yes. On The Pick’em Club everyone picks from their phone, picks lock at kickoff, and the standings update themselves. It keeps going every week through the Super Bowl.",
  ],
];

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default async function ThanksgivingPickSheet() {
  const s = await season();
  // The weekly tiebreaker flag points at Monday night; here the last
  // Thanksgiving game is the tiebreaker.
  const games = (await getThanksgivingGames(s)).map((g) => ({ ...g, isTiebreaker: false }));
  const day = new Date(Date.UTC(s, 10, thanksgivingDay(s))).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />

      <section className="bg-brand-900 text-white print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400 mb-2">
            <Link href="/pick-sheets" className="hover:underline">Free printable pick sheets</Link>
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3">
            Thanksgiving NFL pick sheet {s}
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            All three games on {day}, with kickoff times and a tiebreaker. Print
            one for everyone at the table, from Grandma to the kids.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {games.length > 0 && (
              <PdfDownloadButton
                href="/pick-sheets/thanksgiving/pdf"
                filename={`thanksgiving-nfl-pick-sheet-${s}.pdf`}
              />
            )}
            <PrintButton label="Print the Thanksgiving sheet" />
            <Link
              href="/start"
              className="inline-block rounded-control border border-white/40 px-5 py-2.5 font-semibold text-white hover:bg-white/10"
            >
              Run it online instead
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12 print:p-0 print:max-w-none">
        {games.length > 0 ? (
          <PickSheet
            name={`Thanksgiving NFL Pick Sheet ${s}`}
            games={games}
            note="Circle or check one team per game."
          />
        ) : (
          <Card className="print:hidden">
            <p className="text-text">
              The Thanksgiving schedule for {s} isn’t posted yet. Check back soon, or grab{" "}
              <Link href="/pick-sheets" className="underline">this week’s pick sheet</Link>.
            </p>
          </Card>
        )}

        <section className="print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-5">House rules for a family pick’em</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {IDEAS.map(([title, body]) => (
              <Card key={title}>
                <h3 className="font-semibold text-text mb-1">{title}</h3>
                <p className="text-text-muted">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <div className="rounded-card bg-brand-900 p-8 text-center text-white print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Keep it going after the pie</h2>
          <p className="text-white/85 max-w-xl mx-auto mb-6">
            Turn Thanksgiving into a season-long family pick’em. Everyone picks
            from their phone, picks lock at kickoff, and the leaderboard runs
            through the playoffs and the Super Bowl. Members play free.
          </p>
          <Link
            href="/start"
            className="inline-block rounded-control bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
          >
            Start your group · $10
          </Link>
        </div>

        <section className="print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-5">Thanksgiving pick’em FAQ</h2>
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="rounded-card border border-border bg-surface p-4">
                <summary className="cursor-pointer font-medium text-text">{q}</summary>
                <p className="mt-2 text-text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-text-muted">
            <Link href="/pick-sheets" className="underline">All weekly pick sheets</Link>
            {" · "}
            <Link href="/super-bowl-squares" className="underline">Super Bowl squares guide</Link>
            {" · "}Not affiliated with the NFL.
          </p>
        </section>
      </div>
    </div>
  );
}
