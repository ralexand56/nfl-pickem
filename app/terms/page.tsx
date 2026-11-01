import type { Metadata } from "next";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-text mb-1">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export default function TermsOfService() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-text">Terms of Service</h1>
      <p className="text-sm text-text-muted mb-6">Effective November 1, 2026</p>

      <Card className="space-y-5 text-text-muted">
        <p>
          The Pick&apos;em Club (&quot;the app,&quot; &quot;we,&quot; &quot;us&quot;) is
          operated by Rico Alexander. It helps families and groups of friends run a
          private NFL pick&apos;em. By creating or joining a group, or otherwise
          using the app, you agree to these terms. If you don&apos;t agree, please
          don&apos;t use the app.
        </p>

        <Section title="What the app is">
          <p>
            The app is an entertainment and record-keeping tool. It shows NFL games,
            collects each member&apos;s picks, keeps score and runs a leaderboard for
            your group. It is not a gambling service, sportsbook or fantasy sports
            operator. We don&apos;t offer prizes, set odds, hold anyone&apos;s money, or
            take a share of any pool.
          </p>
        </Section>

        <Section title="Money between members">
          <p>
            The only payment we process is the season fee a group&apos;s admin pays
            for the software. The app never holds, transfers or pays out money
            between members. Optional features such as the buy-in tracker and Super
            Bowl squares simply record what members enter. Any money your group
            exchanges is a private arrangement among its members, and we are not a
            party to it.
          </p>
        </Section>

        <Section title="Following the law">
          <p>
            Laws about pools, contests and wagers differ from place to place. Group
            admins and members are each responsible for making sure their group and
            their own participation follow the laws where they live. Don&apos;t use
            the app where doing so would be unlawful. The app is void where
            prohibited.
          </p>
        </Section>

        <Section title="Eligibility and age">
          <p>
            You must be at least 18 to start a group or to take part in any exchange
            of money with your group. Members under 18 may join a group only with a
            parent or guardian&apos;s permission, and only to make picks for fun.
          </p>
        </Section>

        <Section title="Season fee and refunds">
          <p>
            Starting a group costs a one-time fee, shown at checkout, that covers the
            current NFL season. Payments are processed by Stripe. Nothing renews
            automatically: to keep playing the next season, an admin chooses to pay
            again.
          </p>
          <p>
            If you change your mind, email us within 14 days of paying and before
            your group has made any picks, and we&apos;ll refund the fee in full.
            After that, fees aren&apos;t refundable except where the law requires.
          </p>
        </Section>

        <Section title="Your account and your group">
          <p>
            Keep your sign-in secure; you&apos;re responsible for activity on your
            account. Admins control their group&apos;s settings, invite link and
            membership, including removing members. Your picks and other group
            content belong to you, and you allow us to store and display them to
            your group so the app can work.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Use the app only to run your group&apos;s pick&apos;em. Don&apos;t try to
            access other groups, interfere with the app, misuse invite links, or use
            the app for anything unlawful. We may suspend or remove groups or
            accounts that break these terms.
          </p>
        </Section>

        <Section title="NFL data and trademarks">
          <p>
            Schedules and scores come from third-party sources and may occasionally
            be delayed or wrong; your group&apos;s admin can correct results. The
            Pick&apos;em Club isn&apos;t affiliated with or endorsed by the NFL or any
            team. Team names are used only to identify games.
          </p>
        </Section>

        <Section title="Disclaimers and limits of liability">
          <p>
            The app is provided &quot;as is&quot; and &quot;as available,&quot; without
            warranties of any kind. To the fullest extent the law allows, we
            aren&apos;t liable for indirect or consequential losses, lost money, or
            disputes between members. Our total liability for any claim is limited
            to the season fees you paid us in the 12 months before the claim.
          </p>
        </Section>

        <Section title="Changes and ending service">
          <p>
            We may update these terms and will post the new effective date above;
            continuing to use the app means you accept the update. You can stop
            using the app at any time, and you can ask us to delete your account. If
            we ever shut the app down, we&apos;ll give at least 30 days&apos; notice
            and refund the unused part of any season fee.
          </p>
        </Section>

        <Section title="Governing law and disputes">
          <p>
            These terms are governed by the laws of the State of California, without
            regard to its conflict-of-law rules. Please contact us first so we can
            try to resolve any problem informally. If we can&apos;t, either of us may
            bring a claim in small claims court, or otherwise in the state or federal
            courts located in California.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions or refund requests:{" "}
            <a href="mailto:ralexand56@gmail.com" className="text-brand-600 hover:underline">
              ralexand56@gmail.com
            </a>
            . See also our{" "}
            <a href="/privacy" className="text-brand-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </Section>
      </Card>
    </main>
  );
}
