import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";
import PrintGridButton from "./print-button";

// Public guide that ranks for "Super Bowl squares" searches each January and
// leads into running a board on The Pick'em Club.
export const metadata: Metadata = {
  title: "How to Play Super Bowl Squares: Rules, Payouts & Free Printable Grid",
  description:
    "How Super Bowl squares work, common payout splits, house rules, and a free printable 10×10 grid. Or run your board online with your family and friends.",
  alternates: { canonical: "/super-bowl-squares" },
};

const STEPS: [string, string][] = [
  ["Draw the grid", "Make a 10×10 grid: 100 squares. One team goes across the top, the other down the side."],
  ["Claim squares", "Everyone writes their name in the squares they want, until all 100 are taken."],
  ["Draw the numbers", "Once the board is full, randomly assign the digits 0–9 to the columns and again to the rows. Doing it after the board fills keeps it fair."],
  ["Check each quarter", "At the end of each quarter, take the last digit of each team’s score. The square where those two digits meet wins that quarter."],
];

const PAYOUTS: [string, string, string][] = [
  ["Even split", "25% each quarter", "Simple and fair; good for a first board."],
  ["Final-heavy", "Q1 20% · Half 20% · Q3 20% · Final 40%", "The most common split. Keeps everyone watching to the end."],
  ["Halftime & final", "Half 50% · Final 50%", "Fewer winners, bigger moments."],
];

const FAQS: [string, string][] = [
  [
    "What happens if the game goes to overtime?",
    "Most groups count the final score, including overtime, for the last payout. Decide before kickoff and write it on the board.",
  ],
  [
    "When should the numbers be drawn?",
    "After every square is claimed. If people can see the numbers first, everyone grabs the squares that are known to hit more often, like 0, 3 and 7.",
  ],
  [
    "Which numbers win most often?",
    "Combinations with 0, 7 and 3 come up most, because scores move in field goals and touchdowns. That’s why random numbers drawn after the board fills keep it fair.",
  ],
  [
    "What if some squares go unclaimed?",
    "Common options: the organizer keeps them, they’re split among players, or a winning empty square rolls its share to the next quarter. Agree on it up front.",
  ],
  [
    "Can we play Super Bowl squares online?",
    "Yes. On The Pick’em Club, members claim squares from their phones, the board locks before kickoff, and the numbers are drawn with one tap, with no paper grid to pass around.",
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

export default function SuperBowlSquaresGuide() {
  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />

      <section className="bg-brand-900 text-white print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-accent-400 mb-3">
            Game-day guide
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
            How to play Super Bowl squares
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            The rules, the most popular payout splits, house rules to settle
            before kickoff, and a free printable grid. Or skip the paper and run
            your board online.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#grid"
              className="inline-block rounded-control bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
            >
              Get the free printable grid
            </a>
            <Link
              href="/start"
              className="inline-block rounded-control border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
            >
              Run it online
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-14 print:p-0 print:max-w-none">
        <section className="print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-6">How it works</h2>
          <ol className="grid sm:grid-cols-2 gap-4">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <Card className="h-full">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <h3 className="font-semibold text-text">{title}</h3>
                  </div>
                  <p className="text-text-muted">{body}</p>
                </Card>
              </li>
            ))}
          </ol>
          <Card className="mt-4 bg-accent-50 border-accent-100">
            <p className="text-text">
              <strong>Example:</strong> at the end of the first quarter the score
              is <strong>17–14</strong>. The last digits are <strong>7</strong>{" "}
              and <strong>4</strong>, so whoever holds the square where the 7
              column meets the 4 row wins the first quarter.
            </p>
          </Card>
        </section>

        <section className="print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-2">Popular payout splits</h2>
          <p className="text-text-muted mb-5">
            Agree on the split before the board fills. These are the three most
            groups use.
          </p>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full text-left">
              <thead className="bg-surface-muted text-sm text-text-muted">
                <tr>
                  <th className="p-3 font-semibold">Split</th>
                  <th className="p-3 font-semibold">How it divides</th>
                  <th className="p-3 font-semibold">Good for</th>
                </tr>
              </thead>
              <tbody>
                {PAYOUTS.map(([name, split, note]) => (
                  <tr key={name} className="border-t border-border">
                    <td className="p-3 font-semibold text-text whitespace-nowrap">{name}</td>
                    <td className="p-3 text-text">{split}</td>
                    <td className="p-3 text-text-muted">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="grid" className="scroll-mt-20">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4 print:hidden">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-text">Free printable squares grid</h2>
              <p className="text-text-muted">Print it, pass it around, fill in the teams and numbers.</p>
            </div>
            <PrintGridButton />
          </div>
          <div id="printable-grid" className="rounded-card border border-border bg-white p-4 text-black overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="flex items-center justify-center gap-2 mb-2 pl-9 text-sm font-semibold">
                Team across the top: <span className="inline-block w-48 border-b border-black" />
              </div>
              <div className="flex">
                {/* Rotated label, centered on the grid's height. */}
                <div className="relative w-9 shrink-0">
                  <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-90 items-center gap-2 whitespace-nowrap text-sm font-semibold">
                    Team down the side: <span className="inline-block w-48 border-b border-black" />
                  </div>
                </div>
                <div className="grid flex-1 grid-cols-11 border-l border-t border-black">
                  {Array.from({ length: 121 }, (_, i) => {
                    const header = i < 11 || i % 11 === 0;
                    return (
                      <div
                        key={i}
                        className={`aspect-square border-b border-r border-black ${header ? "bg-gray-100" : ""} ${i === 0 ? "bg-gray-300" : ""}`}
                      />
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-gray-600">
                Run your board online at thepickemclub.com
              </p>
            </div>
          </div>
        </section>

        <Card className="bg-brand-900 border-transparent text-white p-8 text-center print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Skip the paper grid</h2>
          <p className="text-white/85 max-w-xl mx-auto mb-6">
            On The Pick’em Club your group claims squares from their phones, you
            lock the board and draw the numbers with one tap, and everyone sees
            who holds what. It comes with a full NFL pick’em for the season, too.
          </p>
          <Link
            href="/start"
            className="inline-block rounded-control bg-accent-500 px-6 py-3 font-semibold text-brand-900 hover:bg-accent-400"
          >
            Start your group · $10
          </Link>
        </Card>

        <section className="print:hidden">
          <h2 className="text-2xl sm:text-3xl font-bold text-text mb-5">Super Bowl squares FAQ</h2>
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="rounded-card border border-border bg-surface p-4">
                <summary className="cursor-pointer font-medium text-text">{q}</summary>
                <p className="mt-2 text-text-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-text-muted">
            The Pick’em Club doesn’t hold or move money between players. If your
            group plays for money, make sure it’s allowed where you live. Not
            affiliated with the NFL.
          </p>
        </section>
      </div>
    </div>
  );
}
