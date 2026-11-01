import Card from "@/components/ui/Card";

export const metadata = {
  title: "Terms of Service - The Pick'em Club",
};

// Plain-language draft. Have a lawyer review before relying on it (governing
// law and dispute resolution are deliberately not filled in yet).
export default function TermsOfService() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-text">Terms of Service</h1>
      <p className="text-sm text-text-muted mb-6">Last updated November 1, 2026</p>

      <Card className="space-y-5 text-text-muted">
        <p>
          The Pick&apos;em Club (&quot;the app&quot;) is software that helps families
          and groups of friends run a private NFL pick&apos;em. By creating or
          joining a group, you agree to these terms.
        </p>

        <section>
          <h2 className="font-semibold text-text mb-1">What the app is (and isn&apos;t)</h2>
          <p>
            The app is an entertainment and record-keeping tool. It shows NFL
            games, collects each member&apos;s picks, keeps score and runs a
            leaderboard. It is not a gambling service, sportsbook or fantasy sports
            operator. We do not offer prizes, set odds, or take any part of any
            pool.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Money between members</h2>
          <p>
            The only payment the app processes is the season fee a group&apos;s admin
            pays for the software. The app never holds, transfers or pays out
            money between members. Optional features such as the buy-in tracker
            and Super Bowl squares only record what members tell the app. Any
            money exchanged between members is solely their own arrangement.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Your responsibility to follow the law</h2>
          <p>
            Laws about pools and contests differ by state and country. Group
            admins and members are responsible for making sure their group
            follows the laws where they live, and must not use the app where doing
            so would be unlawful. Void where prohibited.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Age</h2>
          <p>
            You must be 18 or older to start a group. Members under 18 may join
            only with a parent or guardian&apos;s permission and must not take part
            in any exchange of money.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Season fee</h2>
          <p>
            Starting a group costs a one-time fee for the current NFL season,
            charged through Stripe. It does not renew automatically. Contact us
            within 14 days of paying if you&apos;d like a refund and haven&apos;t used
            the group yet.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Accounts and conduct</h2>
          <p>
            Keep your sign-in secure and use the app only for your group&apos;s
            pick&apos;em. Admins may remove members from their group. We may suspend
            groups that misuse the app or break these terms.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">No warranty</h2>
          <p>
            Game schedules and scores come from third-party sources and may be
            delayed or wrong. The app is provided &quot;as is&quot;, and to the extent
            the law allows, we aren&apos;t liable for any loss arising from its use,
            including disagreements between members.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-text mb-1">Changes and contact</h2>
          <p>
            We may update these terms and will post the new date above. Questions:{" "}
            <a href="mailto:ralexand56@gmail.com" className="text-brand-600 hover:underline">
              ralexand56@gmail.com
            </a>
            . See also our{" "}
            <a href="/privacy" className="text-brand-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </section>
      </Card>
    </main>
  );
}
