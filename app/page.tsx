import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import type { Metadata } from "next";
import { getUserGroups, getViewerId } from "@/lib/group";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Shown on the page and in the FAQPage structured data; keep them one list
// so the two never disagree.
const FAQS: [string, string][] = [
  [
    "Do my members have to pay?",
    "No. The admin pays $10 for the season and everyone with the invite link plays free.",
  ],
  [
    "Does the app handle any money between members?",
    "No. The only payment is the $10 season fee for the software. The app never holds, moves or pays out money between members.",
  ],
  [
    "Is it just for the NFL?",
    "Yes. The Pick'em Club is built for NFL pick'em: every regular-season and playoff game, plus the Super Bowl squares board.",
  ],
  [
    "What happens next season?",
    "Your group, members and history stay. You can renew for another $10 when the new season starts, or check \"automatically renew\" at signup and it renews every August 15 until you turn it off. Auto-renew is always optional and off unless you choose it.",
  ],
  [
    "Can I be in more than one group?",
    "Yes. Play with your family, your friends and your office, all with the same login, and switch between groups from the menu.",
  ],
];

// Structured data so search engines understand the product, its price and
// the FAQ (eligible for rich results).
const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "10.00",
      priceCurrency: "USD",
      description: "One-time fee per group per NFL season",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

export default async function Home() {
  const viewerId = await getViewerId();
  const groups = viewerId ? await getUserGroups(viewerId) : [];
  if (groups.length > 0) redirect(`/g/${groups[0].slug}`);

  return (
    <div className="bg-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c"),
        }}
      />
      {viewerId && <NoGroupNotice />}
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Faq />
    </div>
  );
}

// Signed in but not in any group: the only ways in are an invite or paying.
function NoGroupNotice() {
  return (
    <div className="bg-brand-50 border-b border-border">
      <p className="max-w-5xl mx-auto px-4 py-3 text-sm text-text">
        You&apos;re signed in but not in a group yet. Ask your group&apos;s admin for
        their invite link, or{" "}
        <Link href="/start" className="font-medium text-brand-700 underline">
          start your own group
        </Link>
        .
      </p>
    </div>
  );
}

function CtaButton({
  className,
  light,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <Link
      href="/start"
      className={clsx(
        "inline-block rounded-control px-6 py-3 font-semibold shadow-sm",
        light
          ? "bg-white text-brand-800 hover:bg-brand-50"
          : "bg-brand-600 text-white hover:bg-brand-700",
        className
      )}
    >
      Start your group · $10
    </Link>
  );
}

// Game-day hero: a watch-party photo (Pexels, free commercial license) behind
// a teal gradient so the white text stays readable at every width.
function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-900">
      <Image
        src="/images/hero-watch-party.jpg"
        alt="Friends on a couch reacting to a big play on TV"
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-[65%_40%] max-md:object-[70%_50%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-900/25 max-md:bg-gradient-to-b max-md:from-brand-900/90 max-md:via-brand-900/75 max-md:to-brand-900/50" />
      <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
        <div className="max-w-xl text-white">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-200 mb-3">
            The NFL pick&apos;em for family &amp; friends
          </p>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.05] mb-5">
            Run your NFL pick&apos;em with family &amp; friends.
          </h1>
          <p className="text-lg text-brand-50/90 mb-8">
            Pick every NFL game each week, with automatic scoring, a live
            leaderboard and a Super Bowl squares board, all in one private group
            for $10 per NFL season. Skip the spreadsheet.
          </p>
          <CtaButton light />
          <p className="text-sm text-brand-100/80 mt-3">
            Members join free with your invite link.
          </p>
        </div>
      </div>
    </section>
  );
}

function Feature({
  title,
  children,
  preview,
  reverse,
}: {
  title: string;
  children: ReactNode;
  preview: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={clsx(
        "grid md:grid-cols-2 gap-8 items-center",
        reverse && "md:[&>*:first-child]:order-2"
      )}
    >
      <div>
        <h3 className="text-2xl font-bold text-text mb-3">{title}</h3>
        <div className="text-text-muted space-y-2">{children}</div>
      </div>
      <div aria-hidden>{preview}</div>
    </div>
  );
}

function PicksPreview() {
  const games = [
    ["KC", "BUF", "BUF"],
    ["DAL", "PHI", "DAL"],
    ["SF", "SEA", "SF"],
  ];
  return (
    <Card className="space-y-3">
      <div className="flex justify-between rounded-control bg-warning-muted px-3 py-2 text-sm text-text">
        <span className="font-semibold">Picks lock in</span>
        <span className="font-mono">1d 04:12:09</span>
      </div>
      {games.map(([away, home, pick]) => (
        <div key={away} className="flex items-center justify-between">
          <span className="text-sm text-text">
            {away} @ {home}
          </span>
          <span className="flex gap-2">
            {[away, home].map((t) => (
              <span
                key={t}
                className={clsx(
                  "rounded-control border px-3 py-1 text-sm",
                  t === pick
                    ? "border-transparent bg-brand-600 text-white"
                    : "border-border text-text"
                )}
              >
                {t}
              </span>
            ))}
          </span>
        </div>
      ))}
    </Card>
  );
}

function LeaderboardPreview() {
  const rows = [
    ["Grandma Jo", 12, 44],
    ["Marcus", 11, 38],
    ["Lisa from work", 11, 51],
    ["Devin", 9, 47],
  ] as const;
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-text">Week 8 Leaderboard</span>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">
          This week
        </span>
      </div>
      <ul className="divide-y divide-border text-sm">
        {rows.map(([name, correct, tb], i) => (
          <li key={name} className="flex items-center justify-between py-2">
            <span className="text-text">
              {i === 0 && "🏆 "}
              {name}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-text">{correct} correct</span>
              <span className="text-xs text-text-muted">TB {tb}</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function CheckInPreview() {
  const people = [
    ["Grandma Jo", true],
    ["Marcus", true],
    ["Lisa from work", false],
    ["Devin", true],
    ["Coach Ray", false],
    ["Kayla", true],
  ] as const;
  return (
    <Card>
      <div className="mb-3 flex justify-between text-sm">
        <span className="font-semibold text-text">Who&apos;s in · Week 8</span>
        <span className="text-text-muted">4 of 6 marked in</span>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {people.map(([name, inThisWeek]) => (
          <li key={name} className="flex items-center gap-2">
            <span
              className={clsx(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                inThisWeek ? "bg-success-muted text-success" : "bg-surface-muted text-text-muted"
              )}
            >
              {inThisWeek ? "✓" : ""}
            </span>
            <span className="text-text truncate">{name}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SquaresPreview() {
  const claimed = new Set([2, 5, 11, 14, 17, 23, 28, 31, 36, 40, 44, 47, 52, 58, 61, 63, 69, 72, 77, 80, 85, 88, 93, 96, 99]);
  const mine = new Set([14, 47, 77]);
  return (
    <Card>
      <div className="mb-3 text-sm font-semibold text-text">Super Bowl Squares</div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            className={clsx(
              "aspect-square rounded-sm",
              mine.has(i)
                ? "bg-success"
                : claimed.has(i)
                  ? "bg-brand-300"
                  : "bg-surface-muted"
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-text-muted">
        <span>Numbers drawn once the board fills</span>
        <span>25 / 100 claimed</span>
      </div>
    </Card>
  );
}

function Features() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12 space-y-16">
      <Feature title="Weekly picks with a live countdown" preview={<PicksPreview />}>
        <p>
          Every NFL game is loaded automatically each week. Members tap a team, and
          a countdown shows exactly when picks lock.
        </p>
        <p>
          A Monday-night tiebreaker (guess the total points) settles ties. You choose
          whether picks lock at the first kickoff or game by game.
        </p>
      </Feature>

      <Feature
        reverse
        title="Scores and the leaderboard update themselves"
        preview={<LeaderboardPreview />}
      >
        <p>
          Final scores come in automatically and the weekly leaderboard ranks
          everyone, tiebreaker included. No more adding up a group text on Tuesday.
        </p>
        <p>
          Every week is labeled <em>Final</em>, <em>This week</em> or{" "}
          <em>Upcoming</em>, so everyone always lands in the right place.
        </p>
      </Feature>

      <Feature title="Optional: keep track of who's in" preview={<CheckInPreview />}>
        <p>
          If your group has a weekly buy-in, your admin can turn on a simple
          tracker where members mark themselves as paid in and admins can update
          anyone. It&apos;s off unless your admin turns it on.
        </p>
        <p className="text-sm">
          The app only keeps the list. It never holds or moves money between
          members.
        </p>
      </Feature>

      <Feature reverse title="Super Bowl squares, built in" preview={<SquaresPreview />}>
        <p>
          Run the classic 10×10 Super Bowl squares board right next to your pick&apos;em.
          Members claim squares, you set the price, and once the board fills you
          draw the random numbers with one tap.
        </p>
        <p>
          Lock the board before kickoff and everyone can see the numbers and who
          holds each square. Turn it on from your admin page, and run more than one
          board if you like.
        </p>
      </Feature>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          [
            "Invite-only & private",
            "Only people with your invite link can join. Reset the link any time.",
          ],
          [
            "You're the commissioner",
            "Add co-admins, remove members, and turn features on or off for your group.",
          ],
          [
            "Works on any phone",
            "Nothing to install. Sign in with Google or an email link.",
          ],
        ].map(([title, body]) => (
          <Card key={title}>
            <h3 className="font-semibold text-text mb-1">{title}</h3>
            <p className="text-sm text-text-muted">{body}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["Start your group", "Name it and pay $10 for the NFL season."],
    ["Share your invite link", "Drop it in your group chat."],
    ["Play all season", "Every NFL game, scored automatically, through the Super Bowl."],
  ];
  return (
    <section className="bg-surface border-y border-border">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-text text-center mb-8">How it works</h2>
        <ol className="grid sm:grid-cols-3 gap-6">
          {steps.map(([title, body], i) => (
            <li key={title} className="text-center">
              <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-brand-600 font-bold text-white">
                {i + 1}
              </div>
              <h3 className="font-semibold text-text">{title}</h3>
              <p className="text-sm text-text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <Card className="max-w-md mx-auto p-8 text-center">
        <h2 className="text-lg font-semibold text-text">One price, whole group</h2>
        <p className="my-4">
          <span className="text-5xl font-bold text-text">$10</span>
          <span className="text-text-muted"> / NFL season</span>
        </p>
        <ul className="text-sm text-text-muted space-y-1 mb-6">
          <li>Unlimited members, free for them</li>
          <li>Weekly picks, tiebreakers and leaderboard</li>
          <li>Optional Super Bowl squares and who&apos;s-in tracker</li>
          <li>Pay once per season, or opt in to auto-renew. Cancel anytime.</li>
        </ul>
        <CtaButton className="w-full" />
      </Card>
    </section>
  );
}

function Faq() {
  return (
    <section className="max-w-3xl mx-auto px-4 pb-16">
      <h2 className="text-2xl font-bold text-text text-center mb-6">Questions</h2>
      <div className="space-y-3">
        {FAQS.map(([q, a]) => (
          <details key={q} className="rounded-card border border-border bg-surface p-4">
            <summary className="cursor-pointer font-medium text-text">{q}</summary>
            <p className="mt-2 text-text-muted">{a}</p>
          </details>
        ))}
      </div>
      <div className="mt-10 text-center">
        <CtaButton />
        <p className="mt-4 text-sm text-text-muted">
          <Link href="/terms" className="underline">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
        </p>
      </div>
    </section>
  );
}
